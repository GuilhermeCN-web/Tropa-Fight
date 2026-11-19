import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// TASK-020: a failing notification adapter must not revert or alter the
// order or the payment, and must not change the HTTP outcome.
const orderId = '0b9f8b7e-58d5-4a3e-9c5d-1d7f0f7c2a11'
const paymentId = '5c1f4f41-8e3e-4d6c-9a5a-0d3f5b7c9e22'
const customerId = '9a7d3c21-6b4e-4f8a-8c2d-3e5f7a9b1c33'

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  processWebhook: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/pool', () => ({
  getDatabasePool: () => ({}),
}))
vi.mock('../../src/modules/auth/presentation/request-identity', () => ({
  requirePermission: vi.fn().mockResolvedValue({
    kind: 'authorized',
    principal: {
      id: '9a7d3c21-6b4e-4f8a-8c2d-3e5f7a9b1c33',
      accountType: 'CUSTOMER',
      status: 'ACTIVE',
      roles: ['CUSTOMER'],
      permissions: ['identity.profile.read:self'],
    },
  }),
}))
vi.mock(
  '../../src/modules/checkout/infrastructure/postgres-checkout-repository',
  () => ({
    PostgresCheckoutRepository: class {
      createOrder = mocks.createOrder
    },
  }),
)
vi.mock(
  '../../src/modules/payments/infrastructure/postgres-payment-repository',
  () => ({
    PostgresPaymentRepository: class {
      processWebhook = mocks.processWebhook
    },
  }),
)
vi.mock('../../src/modules/payments/infrastructure/webhook-signature', () => ({
  verifyPaymentWebhookSignature: () => true,
}))
vi.mock(
  '../../src/modules/notifications/infrastructure/postgres-order-recipient-resolver',
  () => ({
    PostgresOrderRecipientResolver: class {
      customerIdForOrder = async () => '9a7d3c21-6b4e-4f8a-8c2d-3e5f7a9b1c33'
    },
  }),
)

import { POST as createOrder } from '../../app/api/checkout/orders/route'
import { POST as receiveWebhook } from '../../app/api/payments/webhook/route'
import { getLocalNotificationAdapter } from '../../src/modules/notifications/infrastructure/local-order-notifier'

const order = {
  orderId,
  status: 'PENDING_PAYMENT',
  subtotalCents: 10_000,
  discountCents: 0,
  shippingCents: 2_000,
  totalCents: 12_000,
  shipmentStatus: 'NOT_SHIPPED',
  paymentDueAt: '2026-12-19T00:00:00.000Z',
  createdAt: '2026-11-19T00:00:00.000Z',
}

function orderRequest() {
  return new NextRequest('http://localhost/api/checkout/orders', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': '3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b',
    },
    body: JSON.stringify({ quoteId: '7e6d5c4b-3a29-4180-9f7e-6d5c4b3a2918' }),
  })
}

function webhookRequest(type: string) {
  return new NextRequest('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-payment-signature': `sha256=${'a'.repeat(64)}`,
    },
    body: JSON.stringify({
      id: `local-sim-${crypto.randomUUID()}`,
      type,
      paymentId,
      orderId,
      amountCents: 12_000,
      currency: 'BRL',
      occurredAt: new Date().toISOString(),
    }),
  })
}

function approvedPayment(status = 'APPROVED') {
  return {
    kind: 'processed',
    payment: {
      id: paymentId,
      orderId,
      provider: 'LOCAL_MOCK',
      providerPaymentId: 'local-x',
      method: 'PIX',
      amountCents: 12_000,
      currency: 'BRL',
      status,
      idempotencyKey: 'k',
      createdAt: '2026-11-19T00:00:00.000Z',
      updatedAt: '2026-11-19T00:00:00.000Z',
      paidAt: status === 'APPROVED' ? '2026-11-19T00:00:00.000Z' : null,
    },
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  getLocalNotificationAdapter().sent.length = 0
  mocks.createOrder.mockResolvedValue(order)
  mocks.processWebhook.mockResolvedValue(approvedPayment())
})

describe('post-commit order notifications (TASK-020)', () => {
  it('notifies ORDER_CREATED after the order is committed', async () => {
    // A fresh order id per test keeps the shared adapter's dedup isolated.
    const freshOrder = { ...order, orderId: crypto.randomUUID() }
    mocks.createOrder.mockResolvedValue(freshOrder)
    const response = await createOrder(orderRequest())
    expect(response!.status).toBe(201)
    expect(getLocalNotificationAdapter().sent).toEqual([
      expect.objectContaining({
        type: 'ORDER_CREATED',
        recipient: `customer:${customerId}`,
        payload: { orderId: freshOrder.orderId, totalCents: '12000' },
      }),
    ])
  })

  it('keeps the order response when the adapter fails', async () => {
    vi.spyOn(getLocalNotificationAdapter(), 'send').mockRejectedValue(
      new Error('provider offline'),
    )
    const response = await createOrder(orderRequest())
    expect(response!.status).toBe(201)
    expect((await response!.json()).order).toEqual(order)
    expect(mocks.createOrder).toHaveBeenCalledTimes(1)
  })

  it('does not notify when the quote changed (no order created)', async () => {
    mocks.createOrder.mockResolvedValue({ changedQuote: { quoteId: 'q' } })
    const response = await createOrder(orderRequest())
    expect(response!.status).toBe(409)
    expect(getLocalNotificationAdapter().sent).toEqual([])
  })

  it('keeps the webhook response when the adapter fails on approval', async () => {
    vi.spyOn(getLocalNotificationAdapter(), 'send').mockRejectedValue(
      new Error('provider offline'),
    )
    const response = await receiveWebhook(webhookRequest('payment.approved'))
    expect(response!.status).toBe(200)
    expect(await response!.json()).toEqual({ received: true, duplicate: false })
    expect(mocks.processWebhook).toHaveBeenCalledTimes(1)
  })

  it('notifies only processed approvals, not other statuses or duplicates', async () => {
    mocks.processWebhook.mockResolvedValueOnce(approvedPayment('PROCESSING'))
    await receiveWebhook(webhookRequest('payment.processing'))
    mocks.processWebhook.mockResolvedValueOnce({
      kind: 'duplicate',
      payment: approvedPayment().payment,
    })
    await receiveWebhook(webhookRequest('payment.approved'))
    expect(getLocalNotificationAdapter().sent).toEqual([])
  })
})
