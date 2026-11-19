import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'

// TASK-020: GET /health (RNF-014).
const pool = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../../src/infrastructure/database/pool', () => ({
  getDatabasePool: () => pool,
}))

import {
  checkDatabase,
  healthReport,
} from '../../src/infrastructure/database/database-health'
import { GET as health } from '../../app/api/health/route'

const fakePool = (query: () => Promise<unknown>) => () =>
  ({ query }) as unknown as Pool

describe('database health probe', () => {
  it('reports ok when the database answers', async () => {
    await expect(
      checkDatabase(fakePool(async () => ({ rows: [{ '?column?': 1 }] }))),
    ).resolves.toBe('ok')
  })

  it('reports unavailable on errors, missing configuration and timeouts', async () => {
    await expect(
      checkDatabase(fakePool(async () => Promise.reject(new Error('refused')))),
    ).resolves.toBe('unavailable')
    await expect(
      checkDatabase(() => {
        throw new Error('DATABASE_URL is required')
      }),
    ).resolves.toBe('unavailable')
    await expect(
      checkDatabase(
        fakePool(() => new Promise(() => undefined)),
        20,
      ),
    ).resolves.toBe('unavailable')
  })

  it('maps the database state to the public status', () => {
    expect(healthReport('ok')).toEqual({ status: 'ok', database: 'ok' })
    expect(healthReport('unavailable')).toEqual({
      status: 'degraded',
      database: 'unavailable',
    })
  })
})

describe('GET /api/health', () => {
  it('returns 200 with the database available', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const response = await health()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ok', database: 'ok' })
  })

  it('returns 503 without internal details when the database is down', async () => {
    pool.query.mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 127.0.0.1:5432 password=secret'),
    )
    const response = await health()
    expect(response.status).toBe(503)
    const text = await response.text()
    expect(JSON.parse(text)).toEqual({
      status: 'degraded',
      database: 'unavailable',
    })
    expect(text).not.toMatch(/ECONNREFUSED|5432|password|stack/i)
  })
})
