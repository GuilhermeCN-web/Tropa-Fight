import { describe, expect, it } from 'vitest'
import { parsePaymentWebhookEvent } from '../../src/modules/payments/domain/payment'
import { verifyPaymentWebhookSignature } from '../../src/modules/payments/infrastructure/webhook-signature'
import {
  assertLocalTarget,
  buildWebhookEvent,
  parseArguments,
  signWebhookBody,
} from '../../scripts/simulate-payment-webhook.mjs'

const paymentId = '6f1c1e9a-7f3b-4c55-9a51-2a3b4c5d6e7f'
const orderId = '0b6f6d8e-1c2d-4e3f-8a9b-0c1d2e3f4a5b'

describe('payment:simulate script', () => {
  it('builds an event accepted by the existing webhook contract and signature check', () => {
    const rawBody = JSON.stringify(
      buildWebhookEvent({
        paymentId,
        orderId,
        amountCents: 32000,
        type: 'payment.approved',
      }),
    )
    const secret = 'local-test-secret'
    const signature = signWebhookBody(rawBody, secret)

    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
    expect(verifyPaymentWebhookSignature(rawBody, signature, secret)).toBe(true)
    expect(verifyPaymentWebhookSignature(rawBody, signature, 'other')).toBe(
      false,
    )
    expect(parsePaymentWebhookEvent(rawBody)).toMatchObject({
      type: 'payment.approved',
      paymentId,
      orderId,
      amountCents: 32000,
      currency: 'BRL',
    })
  })

  it('uses a unique provider event id per execution', () => {
    const input = {
      paymentId,
      orderId,
      amountCents: 100,
      type: 'payment.processing',
    }
    expect(buildWebhookEvent(input).id).not.toBe(buildWebhookEvent(input).id)
  })

  it('requires the secret, a valid payment id, a known event and a local target', () => {
    expect(() => signWebhookBody('{}', '')).toThrow(/PAYMENT_WEBHOOK_SECRET/)
    expect(() => signWebhookBody('{}', undefined)).toThrow()
    expect(() => parseArguments(['not-a-uuid', 'payment.approved'])).toThrow()
    expect(() => parseArguments([paymentId, 'payment.refunded'])).toThrow()
    expect(parseArguments([paymentId, 'payment.approved'])).toEqual({
      paymentId,
      type: 'payment.approved',
    })
    expect(assertLocalTarget('http://localhost:3023').href).toBe(
      'http://localhost:3023/api/payments/webhook',
    )
    expect(() => assertLocalTarget('https://example.com')).toThrow(/local/)
  })
})
