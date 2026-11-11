import type { NextRequest } from 'next/server'
import { getAdminCustomer } from '../../../../../src/modules/customers/presentation/customer-http'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await context.params
  return getAdminCustomer(request, customerId)
}
