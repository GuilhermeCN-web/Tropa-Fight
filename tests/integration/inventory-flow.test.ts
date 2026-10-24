import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import { PostgresInventoryRepository } from '../../src/modules/inventory/infrastructure/postgres-inventory-repository'

const databaseConfigured = Boolean(process.env.DATABASE_URL)
const basePool = databaseConfigured ? getDatabasePool() : undefined
const schema = `inventory_test_${randomUUID().replaceAll('-', '')}`
const ids = {
  brand: randomUUID(),
  category: randomUUID(),
  product: randomUUID(),
  variant: randomUUID(),
  actor: randomUUID(),
}
let testPool: Pool | undefined
let repository: PostgresInventoryRepository

describe.skipIf(!databaseConfigured)('inventory PostgreSQL integration', () => {
  beforeAll(async () => {
    await basePool!.query(`CREATE SCHEMA ${schema}`)
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      application_name: 'tropa-fight-inventory-tests',
    })
    const client = await testPool.connect()
    try {
      await client.query('BEGIN')
      for (let version = 1; version <= 5; version += 1) {
        const file = `${String(version).padStart(3, '0')}_${
          [
            'identity',
            'audit_logs',
            'catalog',
            'catalog_variants',
            'inventory',
          ][version - 1]
        }.sql`
        await client.query(
          await readFile(join(process.cwd(), 'db', 'migrations', file), 'utf8'),
        )
      }
      await client.query(
        `INSERT INTO identity_users (id, email, password_hash, account_type)
         VALUES ($1, $2, 'test-only-hash', 'ADMIN')`,
        [ids.actor, `inventory-${ids.actor}@example.invalid`],
      )
      await client.query(
        'INSERT INTO catalog_categories (id, name) VALUES ($1, $2)',
        [ids.category, `Inventory ${ids.category.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id, name) VALUES ($1, $2)',
        [ids.brand, `Inventory ${ids.brand.slice(0, 8)}`],
      )
      await client.query(
        `INSERT INTO catalog_products (id, name, brand_id, publication_state)
         VALUES ($1, $2, $3, 'DRAFT')`,
        [ids.product, `Inventory ${ids.product.slice(0, 8)}`, ids.brand],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
        [ids.product, ids.category],
      )
      await client.query(
        `INSERT INTO catalog_product_variants
           (id, product_id, sku, attributes, price_cents, status)
         VALUES ($1, $2, $3, '{}'::jsonb, 100, 'ACTIVE')`,
        [ids.variant, ids.product, `INV-${ids.variant}`],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    repository = new PostgresInventoryRepository(testPool)
  })

  afterAll(async () => {
    if (!databaseConfigured) return
    await testPool?.end()
    await basePool!.query(`DROP SCHEMA ${schema} CASCADE`)
  })

  it('keeps entry, exit, adjustment, audit, and balance consistent', async () => {
    await expect(repository.getBalance(ids.variant)).resolves.toEqual({
      variantId: ids.variant,
      quantity: 0,
    })
    await repository.createMovement({
      variantId: ids.variant,
      actorId: ids.actor,
      type: 'ENTRY',
      quantity: 2,
      reason: 'Initial stock',
    })
    await repository.createMovement({
      variantId: ids.variant,
      actorId: ids.actor,
      type: 'EXIT',
      quantity: 1,
      reason: 'Damaged item',
    })
    await repository.createMovement({
      variantId: ids.variant,
      actorId: ids.actor,
      type: 'ADJUSTMENT',
      quantity: -1,
      reason: 'Physical count',
    })

    await expect(repository.getBalance(ids.variant)).resolves.toEqual({
      variantId: ids.variant,
      quantity: 0,
    })
    const history = await repository.listMovements(ids.variant, {
      page: 1,
      pageSize: 20,
    })
    expect(history.total).toBe(3)
    expect(history.movements.map((movement) => movement.type).sort()).toEqual([
      'ADJUSTMENT',
      'ENTRY',
      'EXIT',
    ])
    await expect(
      testPool!.query('UPDATE inventory_movements SET reason = $1', [
        'tampered history',
      ]),
    ).rejects.toThrow('Inventory movements are immutable.')
    await expect(
      testPool!.query('DELETE FROM inventory_movements'),
    ).rejects.toThrow('Inventory movements are immutable.')
    const audit = await testPool!.query(
      `SELECT count(*)::int AS total FROM audit_logs
        WHERE resource_type = 'InventoryMovement'
          AND resource_id IN (SELECT id::text FROM inventory_movements WHERE variant_id = $1)`,
      [ids.variant],
    )
    expect(audit.rows[0]?.total).toBe(3)
  })

  it('rejects reads and movements for a nonexistent variant', async () => {
    const unknownVariantId = randomUUID()
    await expect(repository.getBalance(unknownVariantId)).rejects.toThrow(
      'Variant not found.',
    )
    await expect(
      repository.listMovements(unknownVariantId, { page: 1, pageSize: 20 }),
    ).rejects.toThrow('Variant not found.')
    await expect(
      repository.createMovement({
        variantId: unknownVariantId,
        actorId: ids.actor,
        type: 'ENTRY',
        quantity: 1,
        reason: 'Unknown variant',
      }),
    ).rejects.toThrow('Variant not found.')
  })

  it('rejects insufficient and concurrent exits without creating extra movements', async () => {
    const before = await repository.listMovements(ids.variant, {
      page: 1,
      pageSize: 100,
    })
    await expect(
      repository.createMovement({
        variantId: ids.variant,
        actorId: ids.actor,
        type: 'EXIT',
        quantity: 1,
        reason: 'Insufficient stock',
      }),
    ).rejects.toThrow('Insufficient stock.')

    await repository.createMovement({
      variantId: ids.variant,
      actorId: ids.actor,
      type: 'ENTRY',
      quantity: 1,
      reason: 'Concurrency setup',
    })
    const attempts = await Promise.allSettled([
      repository.createMovement({
        variantId: ids.variant,
        actorId: ids.actor,
        type: 'EXIT',
        quantity: 1,
        reason: 'Concurrent exit A',
      }),
      repository.createMovement({
        variantId: ids.variant,
        actorId: ids.actor,
        type: 'EXIT',
        quantity: 1,
        reason: 'Concurrent exit B',
      }),
    ])
    expect(
      attempts.filter((attempt) => attempt.status === 'fulfilled'),
    ).toHaveLength(1)
    expect(
      attempts.filter((attempt) => attempt.status === 'rejected'),
    ).toHaveLength(1)
    await expect(repository.getBalance(ids.variant)).resolves.toEqual({
      variantId: ids.variant,
      quantity: 0,
    })
    const after = await repository.listMovements(ids.variant, {
      page: 1,
      pageSize: 100,
    })
    expect(after.total).toBe(before.total + 2)
  })

  it('rolls back the balance when movement persistence fails', async () => {
    const before = await repository.getBalance(ids.variant)
    await expect(
      repository.createMovement({
        variantId: ids.variant,
        actorId: randomUUID(),
        type: 'ENTRY',
        quantity: 4,
        reason: 'Atomicity check',
      }),
    ).rejects.toBeTruthy()
    await expect(repository.getBalance(ids.variant)).resolves.toEqual(before)
  })

  it('grants stock access only to the approved administrator roles', async () => {
    const result = await testPool!.query(
      `SELECT role_code FROM identity_role_permissions
        WHERE permission_code = 'inventory.manage' ORDER BY role_code`,
    )
    expect(result.rows.map((row) => row.role_code)).toEqual([
      'CATALOG_MANAGER',
      'GENERAL_ADMIN',
    ])
  })

  it('keeps concurrent entry and exit operations at a nonnegative balance', async () => {
    const attempts = await Promise.allSettled([
      repository.createMovement({
        variantId: ids.variant,
        actorId: ids.actor,
        type: 'ENTRY',
        quantity: 1,
        reason: 'Concurrent entry',
      }),
      repository.createMovement({
        variantId: ids.variant,
        actorId: ids.actor,
        type: 'EXIT',
        quantity: 1,
        reason: 'Concurrent exit',
      }),
    ])
    const balance = await repository.getBalance(ids.variant)
    expect(balance.quantity).toBeGreaterThanOrEqual(0)
    expect(
      attempts.filter((attempt) => attempt.status === 'fulfilled').length,
    ).toBeGreaterThanOrEqual(1)
  })
})
