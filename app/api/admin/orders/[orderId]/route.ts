import type { NextRequest } from 'next/server'
import { getAdminOrder } from '../../../../../src/modules/orders/presentation/order-http'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params
  return getAdminOrder(request, orderId)
}
