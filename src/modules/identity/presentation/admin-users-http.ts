import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { AdminAccountService } from '../application/admin-account-service'
import { AdminAccountError } from '../domain/admin-account'
import { PostgresAdminAccountRepository } from '../infrastructure/postgres-admin-account-repository'
import { hashPassword } from '../infrastructure/password-hasher'

// Composition point for the database and hashing adapters (ADR-020).
const service = new AdminAccountService(
  new PostgresAdminAccountRepository(),
  hashPassword,
)
const noStore = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore })
}

/** Returns the actor id when every permission is held, or an error response. */
async function authorize(request: NextRequest, permissions: string[]) {
  let actorId: string | null = null
  for (const permission of permissions) {
    const access = await requirePermission(request, permission)
    if (access.kind === 'unauthenticated')
      return { response: json({ error: 'Authentication required.' }, 401) }
    if (access.kind === 'forbidden')
      return { response: json({ error: 'Permission denied.' }, 403) }
    actorId = access.principal.id
  }
  return { actorId: actorId! }
}

async function objectBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function accountError(error: unknown) {
  if (error instanceof AdminAccountError) {
    const status =
      error.code === 'VALIDATION' ? 400 : error.code === 'NOT_FOUND' ? 404 : 409
    return json({ error: error.message, code: error.code }, status)
  }
  return json({ error: 'Unable to complete account operation.' }, 500)
}

export async function listAdminUsers(request: NextRequest) {
  const access = await authorize(request, ['identity.users.read'])
  if ('response' in access) return access.response
  if ([...request.nextUrl.searchParams.keys()].length > 0)
    return json({ error: 'Unsupported query parameter.' }, 400)
  try {
    return json({ users: await service.list() })
  } catch (error) {
    return accountError(error)
  }
}

export async function createAdminUser(request: NextRequest) {
  const access = await authorize(request, ['identity.users.manage'])
  if ('response' in access) return access.response
  try {
    const user = await service.create(access.actorId, await objectBody(request))
    return json({ user }, 201)
  } catch (error) {
    return accountError(error)
  }
}

export async function updateAdminUser(request: NextRequest, userId: string) {
  const access = await authorize(request, [
    'identity.users.manage',
    'identity.roles.manage',
  ])
  if ('response' in access) return access.response
  try {
    const user = await service.update(
      access.actorId,
      userId,
      await objectBody(request),
    )
    return user ? json({ user }) : json({ error: 'Account not found.' }, 404)
  } catch (error) {
    return accountError(error)
  }
}
