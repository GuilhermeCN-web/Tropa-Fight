import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import {
  PromotionError,
  validatePromotionWindow,
  type Promotion,
} from '../domain/promotion'
import type {
  CreatePromotionInput,
  PromotionRepository,
  UpdatePromotionInput,
} from '../application/promotion-repository'

type PromotionRow = {
  id: string
  name: string
  application_type: Promotion['applicationType']
  discount_type: Promotion['discountType']
  discount_value: string
  minimum_cart_subtotal_cents: string | null
  starts_at: Date
  expires_at: Date | null
  status: Promotion['status']
  priority: number
  created_at: Date
  updated_at: Date
}

function safeInteger(value: string | null, label: string): number | null {
  if (value === null) return null
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Stored ${label} exceeds the supported safe integer.`)
  }
  return number
}

function toPromotion(row: PromotionRow): Promotion {
  const discountValue = safeInteger(row.discount_value, 'discount value')
  if (discountValue === null) {
    throw new Error('Stored promotion discount value is invalid.')
  }
  return {
    id: row.id,
    name: row.name,
    applicationType: row.application_type,
    discountType: row.discount_type,
    discountValue,
    minimumCartSubtotalCents: safeInteger(
      row.minimum_cart_subtotal_cents,
      'minimum cart subtotal',
    ),
    startsAt: row.starts_at.toISOString(),
    expiresAt: row.expires_at?.toISOString() ?? null,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
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

function translateDatabaseError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    throw new PromotionError(
      'A promotion with the same unique value already exists.',
      'CONFLICT',
    )
  }
  throw error
}

export class PostgresPromotionRepository implements PromotionRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async list(): Promise<Promotion[]> {
    const result = await this.pool.query<PromotionRow>(
      `SELECT id, name, application_type, discount_type,
              discount_value::text AS discount_value,
              minimum_cart_subtotal_cents::text AS minimum_cart_subtotal_cents,
              starts_at, expires_at, status, priority, created_at, updated_at
         FROM promotions
        ORDER BY created_at DESC, id`,
    )
    return result.rows.map(toPromotion)
  }

  async create(
    input: CreatePromotionInput,
    actorId: string,
  ): Promise<Promotion> {
    try {
      return await inTransaction(this.pool, async (client) => {
        const id = randomUUID()
        const result = await client.query<PromotionRow>(
          `INSERT INTO promotions
             (id, name, application_type, discount_type, discount_value,
              minimum_cart_subtotal_cents, starts_at, expires_at, status,
              priority, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id, name, application_type, discount_type,
                     discount_value::text AS discount_value,
                     minimum_cart_subtotal_cents::text AS minimum_cart_subtotal_cents,
                     starts_at, expires_at, status, priority, created_at, updated_at`,
          [
            id,
            input.name,
            input.applicationType,
            input.discountType,
            input.discountValue,
            input.minimumCartSubtotalCents,
            input.startsAt,
            input.expiresAt,
            input.status,
            input.priority,
            actorId,
          ],
        )
        await insertAuditEvent(
          client,
          createAuditEvent({
            actorId,
            action: 'PROMOTION_CREATED',
            resourceType: 'Promotion',
            resourceId: id,
            result: 'SUCCESS',
            source: 'promotions.admin',
          }),
        )
        return toPromotion(result.rows[0])
      })
    } catch (error) {
      translateDatabaseError(error)
    }
  }

  async update(
    id: string,
    input: UpdatePromotionInput,
    actorId: string,
  ): Promise<Promotion> {
    return inTransaction(this.pool, async (client) => {
      const currentResult = await client.query<PromotionRow>(
        `SELECT id, name, application_type, discount_type,
                discount_value::text AS discount_value,
                minimum_cart_subtotal_cents::text AS minimum_cart_subtotal_cents,
                starts_at, expires_at, status, priority, created_at, updated_at
           FROM promotions WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current)
        throw new PromotionError('Promotion not found.', 'NOT_FOUND')

      const existing = toPromotion(current)
      const startsAt = input.startsAt ?? existing.startsAt
      const expiresAt =
        input.expiresAt === undefined ? existing.expiresAt : input.expiresAt
      validatePromotionWindow(startsAt, expiresAt)
      const result = await client.query<PromotionRow>(
        `UPDATE promotions
            SET name = $2, discount_type = $3, discount_value = $4,
                minimum_cart_subtotal_cents = $5, starts_at = $6,
                expires_at = $7, status = $8, priority = $9, updated_at = now()
          WHERE id = $1
          RETURNING id, name, application_type, discount_type,
                    discount_value::text AS discount_value,
                    minimum_cart_subtotal_cents::text AS minimum_cart_subtotal_cents,
                    starts_at, expires_at, status, priority, created_at, updated_at`,
        [
          id,
          input.name ?? existing.name,
          input.discountType ?? existing.discountType,
          input.discountValue ?? existing.discountValue,
          input.minimumCartSubtotalCents === undefined
            ? existing.minimumCartSubtotalCents
            : input.minimumCartSubtotalCents,
          startsAt,
          expiresAt,
          input.status ?? existing.status,
          input.priority ?? existing.priority,
        ],
      )
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId,
          action: 'PROMOTION_UPDATED',
          resourceType: 'Promotion',
          resourceId: id,
          result: 'SUCCESS',
          source: 'promotions.admin',
        }),
      )
      return toPromotion(result.rows[0])
    })
  }
}
