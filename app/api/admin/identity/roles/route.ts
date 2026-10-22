import { NextResponse, type NextRequest } from 'next/server'
import { listRoles } from '../../../../../src/modules/identity/infrastructure/identity-repository'
import { requirePermission } from '../../../../../src/modules/auth/presentation/request-identity'

export async function GET(request: NextRequest) {
  const access = await requirePermission(request, 'identity.roles.manage')
  if (access.kind === 'unauthenticated') {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    )
  }
  if (access.kind === 'forbidden') {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 })
  }
  return NextResponse.json({ roles: await listRoles() })
}
