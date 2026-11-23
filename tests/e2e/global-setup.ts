import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'
import { databaseUrl, hashPassword, seed, withDatabase } from './fixtures'

/** Creates the dedicated E2E database when missing (local Docker only). */
async function ensureDatabase() {
  const target = new URL(databaseUrl())
  const name = target.pathname.slice(1)
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error('Invalid E2E database name.')
  const admin = new URL(target)
  admin.pathname = '/postgres'
  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  try {
    const exists = await client.query(
      'SELECT 1 FROM pg_database WHERE datname=$1',
      [name],
    )
    if (!exists.rowCount) await client.query(`CREATE DATABASE ${name}`)
  } finally {
    await client.end()
  }
}

async function migrate(client: pg.Client) {
  const directory = path.join(process.cwd(), 'db', 'migrations')
  const files = (await readdir(directory))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true }),
    )
  await client.query('BEGIN')
  try {
    for (const file of files)
      await client.query(await readFile(path.join(directory, file), 'utf8'))
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

/** Idempotent fixtures: fixed ids, refreshed on every run. */
async function seedFixtures(client: pg.Client) {
  const passwordHash = await hashPassword(seed.password)
  await client.query('BEGIN')
  try {
    for (const [user, role] of [
      [seed.generalAdmin, 'GENERAL_ADMIN'],
      [seed.catalogManager, 'CATALOG_MANAGER'],
    ] as const) {
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type,status)
         VALUES ($1,$2,$3,'ADMIN','ACTIVE')
         ON CONFLICT (id) DO UPDATE SET password_hash=EXCLUDED.password_hash,status='ACTIVE'`,
        [user.id, user.email, passwordHash],
      )
      await client.query(
        `INSERT INTO identity_user_roles (user_id,role_code) VALUES ($1,$2)
         ON CONFLICT (user_id) DO UPDATE SET role_code=EXCLUDED.role_code`,
        [user.id, role],
      )
    }
    await client.query(
      `INSERT INTO catalog_categories (id,name) VALUES ($1,'Luvas E2E') ON CONFLICT (id) DO NOTHING`,
      [seed.category],
    )
    await client.query(
      `INSERT INTO catalog_brands (id,name) VALUES ($1,'Tropa E2E') ON CONFLICT (id) DO NOTHING`,
      [seed.brand],
    )
    await client.query(
      `INSERT INTO catalog_products (id,name,description,brand_id,publication_state)
       VALUES ($1,$2,'Luva de treino usada nos testes ponta a ponta.',$3,'PUBLISHED')
       ON CONFLICT (id) DO NOTHING`,
      [seed.product.id, seed.product.name, seed.brand],
    )
    await client.query(
      `INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [seed.product.id, seed.category],
    )
    for (const [variant, size, quantity] of [
      [seed.variantInStock, '12oz', 1_000],
      [seed.variantOutOfStock, '16oz', 0],
    ] as const) {
      await client.query(
        `INSERT INTO catalog_product_variants (id,product_id,sku,attributes,price_cents,status)
         VALUES ($1,$2,$3,$4::jsonb,$5,'ACTIVE') ON CONFLICT (id) DO NOTHING`,
        [
          variant.id,
          seed.product.id,
          variant.sku,
          JSON.stringify({ size, color: 'preta' }),
          variant.priceCents,
        ],
      )
      await client.query(
        `INSERT INTO inventory_stocks (variant_id,quantity) VALUES ($1,$2)
         ON CONFLICT (variant_id) DO UPDATE SET quantity=EXCLUDED.quantity`,
        [variant.id, quantity],
      )
    }
    await client.query(
      `INSERT INTO promotions
         (id,name,application_type,discount_type,discount_value,starts_at,status,created_by)
       VALUES ($1,'Cupom E2E','COUPON','PERCENTAGE',10,now()-interval '1 day','ACTIVE',$2)
       ON CONFLICT (id) DO NOTHING`,
      [seed.promotion, seed.generalAdmin.id],
    )
    await client.query(
      `INSERT INTO coupons (id,promotion_id,code,status,created_by)
       VALUES ($1,$2,$3,'ACTIVE',$4) ON CONFLICT (id) DO NOTHING`,
      [seed.coupon.id, seed.promotion, seed.coupon.code, seed.generalAdmin.id],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

export default async function globalSetup() {
  await ensureDatabase()
  await withDatabase(async (client) => {
    await migrate(client)
    await seedFixtures(client)
  })
}
