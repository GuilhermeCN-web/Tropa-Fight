import type { NextRequest } from 'next/server'
import { getCustomerOrders } from '../../../src/modules/orders/presentation/order-http'

export function GET(request: NextRequest) {
  return getCustomerOrders(request)
}
