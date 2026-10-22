import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure .env.local first.')
}

const migrationPath = fileURLToPath(
  new URL('../db/migrations/001_identity.sql', import.meta.url),
)
const migration = await readFile(migrationPath, 'utf8')
const pool = new Pool({
  connectionString,
  application_name: 'tropa-fight-migrations',
})

try {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(migration)
    await client.query('COMMIT')
    process.stdout.write('Identity schema migration applied.\n')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
