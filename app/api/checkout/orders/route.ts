import type { NextRequest } from 'next/server'
import { createOrder } from '../../../../src/modules/checkout/presentation/checkout-http'

export function POST(request: NextRequest) {
  return createOrder(request)
}
