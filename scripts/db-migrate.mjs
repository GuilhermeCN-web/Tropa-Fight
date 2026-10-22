import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure .env.local first.')
}

const migrationsPath = fileURLToPath(
  new URL('../db/migrations/', import.meta.url),
)
const migrationFiles = (await readdir(migrationsPath))
  .filter((file) => /^\d+.*\.sql$/.test(file))
  .sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true }),
  )
if (migrationFiles.length === 0)
  throw new Error('No database migrations found.')
const pool = new Pool({
  connectionString,
  application_name: 'tropa-fight-migrations',
})

try {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const file of migrationFiles) {
      await client.query(await readFile(join(migrationsPath, file), 'utf8'))
    }
    await client.query('COMMIT')
    process.stdout.write('Database migrations applied.\n')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
