import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import { InventoryError } from '../domain/inventory'
import type {
  InventoryBalance,
  InventoryMovement,
  InventoryMovementType,
} from '../domain/inventory'
import type {
  InventoryMovementPage,
  InventoryRepository,
} from '../application/inventory-repository'

type MovementRow = {
  id: string
  variant_id: string
  actor_id: string
  type: InventoryMovementType
  quantity: string
  reason: string
  created_at: Date
}

function toMovement(row: MovementRow): InventoryMovement {
  const quantity = Number(row.quantity)
  if (!Number.isSafeInteger(quantity)) {
    throw new Error(
      'Stored inventory quantity exceeds the supported safe integer.',
    )
  }
  return {
    id: row.id,
    variantId: row.variant_id,
    actorId: row.actor_id,
    type: row.type,
    quantity,
    reason: row.reason,
    createdAt: row.created_at.toISOString(),
  }
}

async function inTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const movementColumns = `id, variant_id, actor_id, type, quantity::text AS quantity,
                         reason, created_at`

function movementAuditAction(type: InventoryMovementType) {
  switch (type) {
    case 'ENTRY':
      return 'INVENTORY_ENTRY_CREATED' as const
    case 'EXIT':
      return 'INVENTORY_EXIT_CREATED' as const
    case 'ADJUSTMENT':
      return 'INVENTORY_ADJUSTMENT_CREATED' as const
  }
}

export class PostgresInventoryRepository implements InventoryRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async getBalance(variantId: string): Promise<InventoryBalance> {
    const result = await this.pool.query<{ quantity: string | null }>(
      `SELECT s.quantity::text AS quantity
         FROM catalog_product_variants v
         LEFT JOIN inventory_stocks s ON s.variant_id = v.id
        WHERE v.id = $1`,
      [variantId],
    )
    const row = result.rows[0]
    if (!row) throw new InventoryError('Variant not found.', 'NOT_FOUND')
    const quantity = Number(row.quantity ?? '0')
    if (!Number.isSafeInteger(quantity)) {
      throw new Error(
        'Stored inventory quantity exceeds the supported safe integer.',
      )
    }
    return { variantId, quantity }
  }

  async listMovements(variantId: string, page: InventoryMovementPage) {
    const variant = await this.pool.query(
      'SELECT id FROM catalog_product_variants WHERE id = $1',
      [variantId],
    )
    if (!variant.rowCount)
      throw new InventoryError('Variant not found.', 'NOT_FOUND')

    const offset = (page.page - 1) * page.pageSize
    const [count, rows] = await Promise.all([
      this.pool.query<{ total: string }>(
        'SELECT count(*)::text AS total FROM inventory_movements WHERE variant_id = $1',
        [variantId],
      ),
      this.pool.query<MovementRow>(
        `SELECT ${movementColumns}
           FROM inventory_movements
          WHERE variant_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2 OFFSET $3`,
        [variantId, page.pageSize, offset],
      ),
    ])
    return {
      total: Number(count.rows[0]?.total ?? 0),
      movements: rows.rows.map(toMovement),
    }
  }

  async createMovement(input: {
    variantId: string
    actorId: string
    type: InventoryMovementType
    quantity: number
    reason: string
  }) {
    return inTransaction(this.pool, async (client) => {
      const variant = await client.query(
        'SELECT id FROM catalog_product_variants WHERE id = $1',
        [input.variantId],
      )
      if (!variant.rowCount)
        throw new InventoryError('Variant not found.', 'NOT_FOUND')

      await client.query(
        `INSERT INTO inventory_stocks (variant_id, quantity)
         VALUES ($1, 0)
         ON CONFLICT (variant_id) DO NOTHING`,
        [input.variantId],
      )

      const delta = input.type === 'EXIT' ? -input.quantity : input.quantity
      const balanceResult = await client.query<{ quantity: string }>(
        `UPDATE inventory_stocks
            SET quantity = quantity + $2::bigint, updated_at = now()
          WHERE variant_id = $1
            AND quantity + $2::bigint >= 0
          RETURNING quantity::text AS quantity`,
        [input.variantId, delta],
      )
      if (!balanceResult.rowCount) {
        throw new InventoryError('Insufficient stock.', 'INSUFFICIENT_STOCK')
      }

      const movementResult = await client.query<MovementRow>(
        `INSERT INTO inventory_movements
           (id, variant_id, actor_id, type, quantity, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${movementColumns}`,
        [
          randomUUID(),
          input.variantId,
          input.actorId,
          input.type,
          delta,
          input.reason,
        ],
      )
      const movement = toMovement(movementResult.rows[0]!)
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: input.actorId,
          action: movementAuditAction(input.type),
          resourceType: 'InventoryMovement',
          resourceId: movement.id,
          result: 'SUCCESS',
          source: 'inventory.movement',
        }),
      )

      const quantity = Number(balanceResult.rows[0]!.quantity)
      if (!Number.isSafeInteger(quantity)) {
        throw new Error(
          'Stored inventory quantity exceeds the supported safe integer.',
        )
      }
      return {
        balance: { variantId: input.variantId, quantity },
        movement,
      }
    })
  }
}
