import 'server-only'
import { createAuditEvent, type AuditEventInput } from '../domain/audit-event'
import { recordAuditEvent as persistAuditEvent } from '../infrastructure/audit-repository'

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  await persistAuditEvent(createAuditEvent(input))
}
