import type { NextRequest } from 'next/server'
import {
  createAddress,
  listAddresses,
} from '../../../src/modules/checkout/presentation/address-http'

export function GET(request: NextRequest) {
  return listAddresses(request)
}
export function POST(request: NextRequest) {
  return createAddress(request)
}
