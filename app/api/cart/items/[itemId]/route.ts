import type { NextRequest } from 'next/server'
import {
  removeCartItem,
  updateCartItem,
} from '../../../../../src/modules/cart/presentation/http'

type RouteContext = { params: Promise<{ itemId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { itemId } = await context.params
  return updateCartItem(request, itemId)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { itemId } = await context.params
  return removeCartItem(request, itemId)
}
