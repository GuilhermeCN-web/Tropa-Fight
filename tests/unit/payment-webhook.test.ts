import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { PaymentError } from '../../src/modules/payments/domain/payment'
import { verifyPaymentWebhookSignature } from '../../src/modules/payments/infrastructure/webhook-signature'

describe('payment webhook signature', () => {
  const secret = 'local-test-secret'
  const body = '{"id":"event_1","type":"payment.processing"}'
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`

  it('accepts a matching HMAC of the raw body', () => {
    expect(verifyPaymentWebhookSignature(body, signature, secret)).toBe(true)
  })

  it('rejects a changed body or malformed signature', () => {
    expect(verifyPaymentWebhookSignature(`${body} `, signature, secret)).toBe(
      false,
    )
    expect(verifyPaymentWebhookSignature(body, 'sha256=invalid', secret)).toBe(
      false,
    )
  })

  it('fails explicitly when the signing secret is missing', () => {
    expect(() => verifyPaymentWebhookSignature(body, signature, '')).toThrow(
      PaymentError,
    )
  })
})
