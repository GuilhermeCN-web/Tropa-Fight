import { describe, expect, it, vi } from 'vitest'
import { NotificationService } from '../../src/modules/notifications/application/notification-service'
import { OrderNotifier } from '../../src/modules/notifications/application/order-notifications'
import { MockNotificationAdapter } from '../../src/modules/notifications/infrastructure/mock-notification-adapter'

// TASK-020: RF-028, UC-023.
const orderId = '0b9f8b7e-58d5-4a3e-9c5d-1d7f0f7c2a11'
const paymentId = '5c1f4f41-8e3e-4d6c-9a5a-0d3f5b7c9e22'
const customerId = '9a7d3c21-6b4e-4f8a-8c2d-3e5f7a9b1c33'

function setup(
  options: {
    resolver?: () => Promise<string | null>
    adapter?: MockNotificationAdapter
  } = {},
) {
  const adapter = options.adapter ?? new MockNotificationAdapter()
  const logger = { warn: vi.fn() }
  const notifier = new OrderNotifier(
    new NotificationService(adapter),
    {
      customerIdForOrder:
        options.resolver ?? vi.fn().mockResolvedValue(customerId),
    },
    logger,
  )
  return { adapter, logger, notifier }
}

describe('order notifications (TASK-020)', () => {
  it('sends ORDER_CREATED to the customer account without personal data', async () => {
    const { adapter, notifier } = setup()
    await notifier.orderCreated({ orderId, totalCents: 12_000 })
    expect(adapter.sent).toEqual([
      {
        id: `order-created:${orderId}`,
        deduplicationKey: `order-created:${orderId}`,
        recipient: `customer:${customerId}`,
        type: 'ORDER_CREATED',
        template: 'order-created',
        payload: { orderId, totalCents: '12000' },
      },
    ])
  })

  it('sends PAYMENT_APPROVED keyed by payment', async () => {
    const { adapter, notifier } = setup()
    await notifier.paymentApproved({ paymentId, orderId, amountCents: 6_500 })
    expect(adapter.sent).toEqual([
      expect.objectContaining({
        type: 'PAYMENT_APPROVED',
        deduplicationKey: `payment-approved:${paymentId}`,
        recipient: `customer:${customerId}`,
        payload: { orderId, paymentId, amountCents: '6500' },
      }),
    ])
  })

  it('generates at most one notification per event', async () => {
    const { adapter, notifier } = setup()
    await notifier.orderCreated({ orderId, totalCents: 1 })
    await notifier.orderCreated({ orderId, totalCents: 1 })
    await notifier.paymentApproved({ paymentId, orderId, amountCents: 1 })
    await notifier.paymentApproved({ paymentId, orderId, amountCents: 1 })
    expect(adapter.sent.map((item) => item.type)).toEqual([
      'ORDER_CREATED',
      'PAYMENT_APPROVED',
    ])
  })

  it('never propagates adapter failures and logs without personal data', async () => {
    const adapter = new MockNotificationAdapter()
    vi.spyOn(adapter, 'send').mockRejectedValue(new Error('provider offline'))
    const { logger, notifier } = setup({ adapter })
    await expect(
      notifier.orderCreated({ orderId, totalCents: 1 }),
    ).resolves.toBeUndefined()
    expect(logger.warn).toHaveBeenCalledTimes(1)
    const message = logger.warn.mock.calls[0]![0] as string
    expect(message).toContain('ORDER_CREATED')
    expect(message).toContain(orderId)
    expect(message).not.toContain(customerId)
    expect(message).not.toContain('provider offline')
  })

  it('never propagates resolver failures and skips orders without a recipient', async () => {
    const failing = setup({
      resolver: vi.fn().mockRejectedValue(new Error('db down')),
    })
    await expect(
      failing.notifier.paymentApproved({ paymentId, orderId, amountCents: 1 }),
    ).resolves.toBeUndefined()
    expect(failing.adapter.sent).toEqual([])
    expect(failing.logger.warn).toHaveBeenCalledTimes(1)

    const missing = setup({ resolver: vi.fn().mockResolvedValue(null) })
    await missing.notifier.orderCreated({ orderId, totalCents: 1 })
    expect(missing.adapter.sent).toEqual([])
    expect(missing.logger.warn).toHaveBeenCalledTimes(1)
  })
})
