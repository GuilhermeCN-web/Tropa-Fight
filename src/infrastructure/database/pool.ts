import 'server-only'
import { Pool } from 'pg'

declare global {
  var identityPool: Pool | undefined
}

export function getDatabasePool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for identity persistence.')
  }

  if (!globalThis.identityPool) {
    globalThis.identityPool = new Pool({
      connectionString,
      max: 10,
      application_name: 'tropa-fight-local',
    })
  }

  return globalThis.identityPool
}
