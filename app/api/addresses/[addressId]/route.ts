import type { NextRequest } from 'next/server'
import {
  getAddress,
  updateAddress,
} from '../../../../src/modules/checkout/presentation/address-http'

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/addresses/[addressId]'>,
) {
  return getAddress(request, (await context.params).addressId)
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<'/api/addresses/[addressId]'>,
) {
  return updateAddress(request, (await context.params).addressId)
}
