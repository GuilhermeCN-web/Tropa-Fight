import 'server-only'
import type { NextRequest } from 'next/server'
import type { IdentityPrincipal } from '../../identity/domain/identity-user'
import {
  hasPermission,
  principalFromCookie,
  sessionCookieName,
} from '../application/session-service'

export type IdentityAccess =
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden'; principal: IdentityPrincipal }
  | { kind: 'authorized'; principal: IdentityPrincipal }

export async function requirePermission(
  request: NextRequest,
  permission: string,
): Promise<IdentityAccess> {
  const token = request.cookies.get(sessionCookieName)?.value
  const principal = await principalFromCookie(token)
  if (!principal) return { kind: 'unauthenticated' }
  if (!hasPermission(principal, permission)) {
    return { kind: 'forbidden', principal }
  }
  return { kind: 'authorized', principal }
}
