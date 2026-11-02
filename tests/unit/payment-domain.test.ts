import { describe, expect, it } from 'vitest'
import {
  canTransitionPayment,
  normalizeCreatePaymentInput,
  parsePaymentWebhookEvent,
  PaymentError,
  statusForPaymentEvent,
} from '../../src/modules/payments/domain/payment'

const orderId = 'c0f6c943-0f69-45aa-91c3-8701eb5a5d19'
const paymentId = 'f7d8ee25-53eb-4830-8574-6f4365f210c4'

describe('payment domain', () => {
  it('accepts only the approved methods and request shape', () => {
    expect(normalizeCreatePaymentInput({ orderId, method: 'PIX' })).toEqual({
      orderId,
      method: 'PIX',
    })
    expect(() =>
      normalizeCreatePaymentInput({
        orderId,
        method: 'PIX',
        cardNumber: '4111111111111111',
      }),
    ).toThrow(PaymentError)
  })

  it('parses the signed mock webhook contract', () => {
    expect(
      parsePaymentWebhookEvent(
        JSON.stringify({
          id: 'event_123',
          type: 'payment.approved',
          paymentId,
          orderId,
          amountCents: 12000,
          currency: 'BRL',
          occurredAt: '2026-11-02T12:00:00.000Z',
        }),
      ),
    ).toMatchObject({
      id: 'event_123',
      type: 'payment.approved',
      paymentId,
      orderId,
      amountCents: 12000,
      currency: 'BRL',
    })
  })

  it('rejects malformed or sensitive webhook fields', () => {
    expect(() => parsePaymentWebhookEvent('{')).toThrow(PaymentError)
    expect(() =>
      parsePaymentWebhookEvent(
        JSON.stringify({
          id: 'event_123',
          type: 'payment.approved',
          paymentId,
          orderId,
          amountCents: 12000,
          currency: 'BRL',
          occurredAt: '2026-11-02T12:00:00.000Z',
          cardNumber: '4111111111111111',
        }),
      ),
    ).toThrow(PaymentError)
  })

  it('allows only approved transitions and maps event types', () => {
    expect(canTransitionPayment('PENDING', 'PROCESSING')).toBe(true)
    expect(canTransitionPayment('PROCESSING', 'APPROVED')).toBe(true)
    expect(canTransitionPayment('APPROVED', 'PROCESSING')).toBe(false)
    expect(canTransitionPayment('FAILED', 'APPROVED')).toBe(false)
    expect(statusForPaymentEvent('payment.expired')).toBe('EXPIRED')
  })
})
