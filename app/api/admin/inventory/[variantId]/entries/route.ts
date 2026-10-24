import type { NextRequest } from 'next/server'
import { createInventoryMovement } from '../../../../../../src/modules/inventory/presentation/http'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await context.params
  return createInventoryMovement(request, variantId, 'ENTRY')
}
