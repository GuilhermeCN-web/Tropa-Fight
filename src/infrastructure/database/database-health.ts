import 'server-only'
import type { Pool } from 'pg'
import { getDatabasePool } from './pool'

export type DatabaseHealth = 'ok' | 'unavailable'

export type HealthReport = {
  status: 'ok' | 'degraded'
  database: DatabaseHealth
}

const defaultTimeoutMilliseconds = 2_000

/**
 * Connectivity probe for `GET /health` (RNF-014, TASK-020). Any failure —
 * missing configuration, refused connection, timeout — maps to
 * `unavailable`; the cause is deliberately not exposed.
 */
export async function checkDatabase(
  pool?: () => Pool,
  timeoutMilliseconds = defaultTimeoutMilliseconds,
): Promise<DatabaseHealth> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const probe = (pool ?? getDatabasePool)().query('SELECT 1')
    probe.catch(() => undefined)
    await Promise.race([
      probe,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('timeout')),
          timeoutMilliseconds,
        )
      }),
    ])
    return 'ok'
  } catch {
    return 'unavailable'
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function healthReport(database: DatabaseHealth): HealthReport {
  return { status: database === 'ok' ? 'ok' : 'degraded', database }
}
