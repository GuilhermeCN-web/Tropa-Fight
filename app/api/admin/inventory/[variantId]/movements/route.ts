import type { NextRequest } from 'next/server'
import { getInventoryMovements } from '../../../../../../src/modules/inventory/presentation/http'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await context.params
  return getInventoryMovements(request, variantId)
}
