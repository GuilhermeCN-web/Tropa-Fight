import type { NextRequest } from 'next/server'
import {
  applyCartCoupon,
  removeCartCoupon,
} from '../../../../src/modules/cart/presentation/http'

export function POST(request: NextRequest) {
  return applyCartCoupon(request)
}

export function DELETE(request: NextRequest) {
  return removeCartCoupon(request)
}
