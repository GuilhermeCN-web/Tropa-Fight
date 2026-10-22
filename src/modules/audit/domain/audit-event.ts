import { randomUUID } from 'node:crypto'

export const auditActions = [
  'AUTH_LOGIN',
  'AUTH_LOGIN_FAILED',
  'AUTH_LOGOUT',
  'AUTH_PASSWORD_RESET_REQUESTED',
  'AUTH_PASSWORD_RESET',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ROLE_CHANGED',
] as const

export type AuditAction = (typeof auditActions)[number]
export type AuditResult = 'SUCCESS' | 'FAILURE' | 'DENIED'

export type AuditEventInput = {
  actorId: string | null
  action: AuditAction
  resourceType?: string | null
  resourceId?: string | null
  result: AuditResult
  source: string
  correlationId?: string
  metadata?: Record<string, unknown>
}

export type AuditEvent = {
  id: string
  actorId: string | null
  action: AuditAction
  resourceType: string | null
  resourceId: string | null
  result: AuditResult
  source: string
  correlationId: string
  metadata: Record<string, string>
}

const safeMetadataKeys = new Set(['requestId', 'correlationId', 'reasonCode'])
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const safeIdentifierPattern = /^[a-zA-Z0-9_-]{1,128}$/

function sanitizeIdentifier(value: string | null | undefined): string | null {
  if (!value || !safeIdentifierPattern.test(value) || value.includes('@')) {
    return null
  }
  return value
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!metadata) return {}
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (!safeMetadataKeys.has(key) || typeof value !== 'string') continue
    const trimmed = value.trim()
    if (key === 'correlationId' || key === 'requestId') {
      if (uuidPattern.test(trimmed)) sanitized[key] = trimmed
      continue
    }
    if (safeIdentifierPattern.test(trimmed)) sanitized[key] = trimmed
  }
  return sanitized
}

export function createAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    id: randomUUID(),
    actorId:
      input.actorId && uuidPattern.test(input.actorId) ? input.actorId : null,
    action: input.action,
    resourceType: sanitizeIdentifier(input.resourceType),
    resourceId:
      input.resourceType === 'IdentityUser' || input.resourceType === 'Session'
        ? input.resourceId && uuidPattern.test(input.resourceId)
          ? input.resourceId
          : null
        : sanitizeIdentifier(input.resourceId),
    result: input.result,
    source: sanitizeIdentifier(input.source) ?? 'unknown',
    correlationId:
      input.correlationId && uuidPattern.test(input.correlationId)
        ? input.correlationId
        : randomUUID(),
    metadata: sanitizeAuditMetadata(input.metadata),
  }
}
