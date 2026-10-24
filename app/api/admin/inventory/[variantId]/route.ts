import type { NextRequest } from 'next/server'
import { getInventoryBalance } from '../../../../../src/modules/inventory/presentation/http'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await context.params
  return getInventoryBalance(request, variantId)
}
