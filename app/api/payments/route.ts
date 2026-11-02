import type { NextRequest } from 'next/server'
import { createPayment } from '../../../src/modules/payments/presentation/payment-http'

export function POST(request: NextRequest) {
  return createPayment(request)
}
