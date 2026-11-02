import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { IdentityPrincipal } from '../../src/modules/identity/domain/identity-user'

const { processWebhook, getPayment, recordAuditEvent, requirePermission } =
  vi.hoisted(() => ({
    processWebhook: vi.fn(),
    getPayment: vi.fn(),
    recordAuditEvent: vi.fn().mockResolvedValue(undefined),
    requirePermission: vi.fn(),
  }))
const customerId = 'c0f6c943-0f69-45aa-91c3-8701eb5a5d19'
const paymentId = 'f7d8ee25-53eb-4830-8574-6f4365f210c4'

vi.mock(
  '../../src/modules/payments/infrastructure/postgres-payment-repository',
  () => ({
    PostgresPaymentRepository: class {
      processWebhook = processWebhook
      getPayment = getPayment
    },
  }),
)
vi.mock(
  '../../src/modules/payments/infrastructure/local-mock-payment-gateway',
  () => ({
    LocalMockPaymentGateway: class {},
  }),
)
vi.mock('../../src/modules/auth/presentation/request-identity', () => ({
  requirePermission,
}))
vi.mock('../../src/modules/audit/infrastructure/audit-repository', () => ({
  recordAuditEvent,
}))

import {
  getPayment as getPaymentRoute,
  receivePaymentWebhook,
} from '../../src/modules/payments/presentation/payment-http'

const secret = 'payment-http-test-secret'
const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET

beforeEach(() => {
  process.env.PAYMENT_WEBHOOK_SECRET = secret
  processWebhook.mockReset()
  getPayment.mockReset()
  recordAuditEvent.mockReset()
  recordAuditEvent.mockResolvedValue(undefined)
  requirePermission.mockReset()
})

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.PAYMENT_WEBHOOK_SECRET
  } else {
    process.env.PAYMENT_WEBHOOK_SECRET = originalSecret
  }
})

describe('payment HTTP webhook', () => {
  it('rejects invalid signatures before invoking payment processing', async () => {
    const body = JSON.stringify({
      id: 'event_123',
      type: 'payment.approved',
      paymentId: 'f7d8ee25-53eb-4830-8574-6f4365f210c4',
      orderId: 'c0f6c943-0f69-45aa-91c3-8701eb5a5d19',
      amountCents: 12000,
      currency: 'BRL',
      occurredAt: '2026-11-02T12:00:00.000Z',
    })
    const invalidSignature = `sha256=${createHmac('sha256', 'wrong-secret')
      .update(body)
      .digest('hex')}`
    const response = await receivePaymentWebhook(
      new NextRequest('http://localhost/api/payments/webhook', {
        method: 'POST',
        body,
        headers: { 'x-payment-signature': invalidSignature },
      }),
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(recordAuditEvent).toHaveBeenCalledOnce()
    expect(processWebhook).not.toHaveBeenCalled()
  })
})

describe('payment HTTP reads', () => {
  it('requires authentication and scopes reads to the authenticated customer', async () => {
    const request = new NextRequest(
      `http://localhost/api/payments/${paymentId}`,
    )
    requirePermission.mockResolvedValue({ kind: 'unauthenticated' })

    const unauthenticated = await getPaymentRoute(request, paymentId)
    expect(unauthenticated?.status).toBe(401)
    expect(getPayment).not.toHaveBeenCalled()

    const principal: IdentityPrincipal = {
      id: customerId,
      email: 'customer@example.invalid',
      accountType: 'CUSTOMER',
      status: 'ACTIVE',
      roles: ['CUSTOMER'],
      permissions: ['identity.profile.read:self'],
      createdAt: new Date(0).toISOString(),
    }
    requirePermission.mockResolvedValue({ kind: 'authorized', principal })
    getPayment.mockResolvedValue(null)

    const notOwned = await getPaymentRoute(request, paymentId)
    expect(notOwned?.status).toBe(404)
    expect(getPayment).toHaveBeenCalledWith(customerId, paymentId)
  })
})
