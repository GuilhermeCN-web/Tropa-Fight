import type { NextRequest } from 'next/server'
import { getAdminCustomers } from '../../../../src/modules/customers/presentation/customer-http'

export function GET(request: NextRequest) {
  return getAdminCustomers(request)
}
