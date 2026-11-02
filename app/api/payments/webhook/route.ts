import type { NextRequest } from 'next/server'
import { receivePaymentWebhook } from '../../../../src/modules/payments/presentation/payment-http'

export function POST(request: NextRequest) {
  return receivePaymentWebhook(request)
}
