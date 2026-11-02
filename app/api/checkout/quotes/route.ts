import type { NextRequest } from 'next/server'
import { createQuote } from '../../../../src/modules/checkout/presentation/checkout-http'

export function POST(request: NextRequest) {
  return createQuote(request)
}
