import 'server-only'
import type { IdentityPrincipal } from '../../identity/domain/identity-user'
import {
  findPrincipalBySession,
  revokeSession,
} from '../../identity/infrastructure/identity-repository'

export const sessionCookieName = 'tropa_session'

export async function principalFromCookie(
  token: string | undefined,
): Promise<IdentityPrincipal | null> {
  if (!token || token.length > 100) return null
  return findPrincipalBySession(token)
}

export async function endSession(token: string | undefined): Promise<void> {
  if (token) await revokeSession(token)
}

export function hasPermission(
  principal: IdentityPrincipal,
  permission: string,
): boolean {
  return (
    principal.status === 'ACTIVE' && principal.permissions.includes(permission)
  )
}
