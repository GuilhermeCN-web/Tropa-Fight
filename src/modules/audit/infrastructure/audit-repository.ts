import 'server-only'
import type { PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import type { AuditEvent } from '../domain/audit-event'

export async function insertAuditEvent(
  client: PoolClient,
  event: AuditEvent,
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs
      (id, actor_id, action, resource_type, resource_id, result, source, correlation_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [
      event.id,
      event.actorId,
      event.action,
      event.resourceType,
      event.resourceId,
      event.result,
      event.source,
      event.correlationId,
      JSON.stringify(event.metadata),
    ],
  )
}

export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  const client = await getDatabasePool().connect()
  try {
    await client.query('BEGIN')
    await insertAuditEvent(client, event)
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export type AuditLogEntry = {
  id: string
  actorId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  result: string
  source: string
  timestamp: string
  correlationId: string
  metadata: Record<string, string>
}

export type AuditLogFilter = {
  page: number
  pageSize: number
  actorId?: string
  action?: string
  resourceType?: string
  resourceId?: string
  result?: string
  from?: string
  to?: string
}

export async function listAuditLogs(filter: AuditLogFilter): Promise<{
  entries: AuditLogEntry[]
  total: number
}> {
  const pool = getDatabasePool()
  const values: unknown[] = []
  const conditions: string[] = []
  const add = (column: string, value: unknown, operator = '=') => {
    values.push(value)
    conditions.push(`${column} ${operator} $${values.length}`)
  }

  if (filter.actorId) add('actor_id', filter.actorId)
  if (filter.action) add('action', filter.action)
  if (filter.resourceType) add('resource_type', filter.resourceType)
  if (filter.resourceId) add('resource_id', filter.resourceId)
  if (filter.result) add('result', filter.result)
  if (filter.from) add('created_at', filter.from, '>=')
  if (filter.to) add('created_at', filter.to, '<=')

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const count = await pool.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM audit_logs ${where}`,
    values,
  )
  const offset = (filter.page - 1) * filter.pageSize
  const pageValues = [...values, filter.pageSize, offset]
  const rows = await pool.query<{
    id: string
    actor_id: string | null
    action: string
    resource_type: string | null
    resource_id: string | null
    result: string
    source: string
    created_at: Date
    correlation_id: string
    metadata: Record<string, string>
  }>(
    `SELECT id, actor_id, action, resource_type, resource_id, result, source,
            created_at, correlation_id, metadata
       FROM audit_logs ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    pageValues,
  )

  return {
    total: Number(count.rows[0]?.total ?? 0),
    entries: rows.rows.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      result: row.result,
      source: row.source,
      timestamp: row.created_at.toISOString(),
      correlationId: row.correlation_id,
      metadata: row.metadata,
    })),
  }
}
