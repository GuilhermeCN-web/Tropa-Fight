import { createHmac, timingSafeEqual } from 'node:crypto'
import { PaymentError } from '../domain/payment'

export function verifyPaymentWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret = process.env.PAYMENT_WEBHOOK_SECRET,
): boolean {
  if (!secret) {
    throw new PaymentError(
      'PAYMENT_WEBHOOK_SECRET is required.',
      'CONFIGURATION',
    )
  }
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false
  const supplied = Buffer.from(signature.slice('sha256='.length), 'hex')
  const expected = createHmac('sha256', secret).update(rawBody).digest()
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  )
}
