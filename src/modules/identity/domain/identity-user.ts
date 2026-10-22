export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
export type AccountType = 'CUSTOMER' | 'ADMIN'

export type IdentityPrincipal = {
  id: string
  email: string
  accountType: AccountType
  status: AccountStatus
  roles: string[]
  permissions: string[]
  createdAt: string
}

export type PublicIdentityProfile = Pick<
  IdentityPrincipal,
  'id' | 'email' | 'accountType' | 'status' | 'roles' | 'createdAt'
>

export function toPublicProfile(
  principal: IdentityPrincipal,
): PublicIdentityProfile {
  return {
    id: principal.id,
    email: principal.email,
    accountType: principal.accountType,
    status: principal.status,
    roles: principal.roles,
    createdAt: principal.createdAt,
  }
}
