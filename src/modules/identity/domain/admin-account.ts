import {
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from './password-policy'

/** Roles an administrative account may hold (ADR-011, DIV-010). */
export const adminRoles = ['GENERAL_ADMIN', 'CATALOG_MANAGER'] as const
export type AdminRole = (typeof adminRoles)[number]

/** Status values settable through `PATCH /admin/users/{userId}`. */
export const manageableStatuses = ['ACTIVE', 'INACTIVE'] as const
export type ManageableStatus = (typeof manageableStatuses)[number]

export type AdminAccount = {
  id: string
  email: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  role: AdminRole
}

export type NewAdminAccount = {
  email: string
  password: string
  role: AdminRole
}

export type AdminAccountChange = {
  status?: ManageableStatus
  role?: AdminRole
}

export class AdminAccountError extends Error {
  readonly code: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'LAST_GENERAL_ADMIN'

  constructor(message: string, code: AdminAccountError['code']) {
    super(message)
    this.code = code
    this.name = 'AdminAccountError'
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new AdminAccountError(`${label} must be an object.`, 'VALIDATION')
  return value as Record<string, unknown>
}

export function isAdminRole(value: unknown): value is AdminRole {
  return (adminRoles as readonly unknown[]).includes(value)
}

function requireRole(value: unknown): AdminRole {
  if (!isAdminRole(value))
    throw new AdminAccountError(
      'Role must be GENERAL_ADMIN or CATALOG_MANAGER.',
      'VALIDATION',
    )
  return value
}

export function normalizeNewAdminAccount(value: unknown): NewAdminAccount {
  const input = record(value, 'Account')
  const keys = Object.keys(input)
  if (
    keys.length !== 3 ||
    !['email', 'password', 'role'].every((key) => keys.includes(key))
  )
    throw new AdminAccountError(
      'Account requires exactly email, password and role.',
      'VALIDATION',
    )
  if (typeof input.email !== 'string' || typeof input.password !== 'string')
    throw new AdminAccountError(
      'Email and password must be strings.',
      'VALIDATION',
    )
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email))
    throw new AdminAccountError('Enter a valid email address.', 'VALIDATION')
  const passwordErrors = validatePassword(input.password)
  if (passwordErrors.length > 0)
    throw new AdminAccountError(passwordErrors.join(' '), 'VALIDATION')
  return { email, password: input.password, role: requireRole(input.role) }
}

export function normalizeAdminAccountChange(
  value: unknown,
): AdminAccountChange {
  const input = record(value, 'Account change')
  const keys = Object.keys(input)
  if (
    keys.length === 0 ||
    keys.some((key) => key !== 'status' && key !== 'role')
  )
    throw new AdminAccountError(
      'Account change accepts only status and/or role.',
      'VALIDATION',
    )
  const change: AdminAccountChange = {}
  if ('status' in input) {
    if (!(manageableStatuses as readonly unknown[]).includes(input.status))
      throw new AdminAccountError(
        'Status must be ACTIVE or INACTIVE.',
        'VALIDATION',
      )
    change.status = input.status as ManageableStatus
  }
  if ('role' in input) change.role = requireRole(input.role)
  return change
}

/**
 * RN-022: the last active GENERAL_ADMIN cannot be deactivated or lose the
 * role. `otherActiveGeneralAdmins` excludes the target account.
 */
export function assertKeepsAGeneralAdmin(
  current: Pick<AdminAccount, 'status' | 'role'>,
  change: AdminAccountChange,
  otherActiveGeneralAdmins: number,
) {
  const isActiveGeneralAdmin =
    current.status === 'ACTIVE' && current.role === 'GENERAL_ADMIN'
  if (!isActiveGeneralAdmin || otherActiveGeneralAdmins > 0) return
  const deactivates = change.status !== undefined && change.status !== 'ACTIVE'
  const demotes = change.role !== undefined && change.role !== 'GENERAL_ADMIN'
  if (deactivates || demotes)
    throw new AdminAccountError(
      'The last active GENERAL_ADMIN cannot be deactivated or demoted.',
      'LAST_GENERAL_ADMIN',
    )
}
