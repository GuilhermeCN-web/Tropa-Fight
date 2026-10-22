import { describe, expect, it } from 'vitest'
import {
  createAuditEvent,
  sanitizeAuditMetadata,
} from '../../src/modules/audit/domain/audit-event'

describe('audit event', () => {
  it('keeps only approved metadata fields and bounded text', () => {
    expect(
      sanitizeAuditMetadata({
        requestId: 'a19c0f42-2697-401f-bc04-231078e486aa',
        correlationId: 'a19c0f42-2697-401f-bc04-231078e486aa',
        reasonCode: 'policy',
        password: 'secret-value',
        email: 'person@example.test',
        requestIdTooLong: 'x'.repeat(129),
      }),
    ).toEqual({
      requestId: 'a19c0f42-2697-401f-bc04-231078e486aa',
      correlationId: 'a19c0f42-2697-401f-bc04-231078e486aa',
      reasonCode: 'policy',
    })
  })

  it('creates identifiers and uses empty metadata by default', () => {
    const event = createAuditEvent({
      actorId: null,
      action: 'AUTH_LOGIN_FAILED',
      result: 'FAILURE',
      source: 'identity.login',
    })
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(event.correlationId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(event.metadata).toEqual({})
  })

  it('drops personal data from audit identifiers and metadata', () => {
    const event = createAuditEvent({
      actorId: 'person@example.test',
      action: 'USER_CREATED',
      resourceType: 'IdentityUser',
      resourceId: 'person@example.test',
      result: 'SUCCESS',
      source: 'identity.register',
      metadata: {
        requestId: 'person@example.test',
        reasonCode: 'account-created',
      },
    })

    expect(event.actorId).toBeNull()
    expect(event.resourceId).toBeNull()
    expect(event.metadata).toEqual({ reasonCode: 'account-created' })
  })
})
