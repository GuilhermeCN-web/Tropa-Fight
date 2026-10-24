import type { NextRequest } from 'next/server'
import {
  addCartItem,
  getCart,
} from '../../../src/modules/cart/presentation/http'

export function GET(request: NextRequest) {
  return getCart(request)
}

export function POST(request: NextRequest) {
  return addCartItem(request)
}
