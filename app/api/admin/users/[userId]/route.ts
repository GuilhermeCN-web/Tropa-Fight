import type { NextRequest } from 'next/server'
import { updateAdminUser } from '../../../../../src/modules/identity/presentation/admin-users-http'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params
  return updateAdminUser(request, userId)
}
