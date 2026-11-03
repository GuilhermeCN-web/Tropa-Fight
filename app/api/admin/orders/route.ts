import type { NextRequest } from 'next/server'
import { getAdminOrders } from '../../../../src/modules/orders/presentation/order-http'

export function GET(request: NextRequest) {
  return getAdminOrders(request)
}
