export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

/**
 * Administrative read model of a customer account (RF-034, RN-019).
 * Deliberately excludes CPF, phone, addresses and credentials.
 */
export type CustomerSummary = {
  id: string
  email: string
  status: CustomerStatus
  createdAt: string
  ordersCount: number
}

export type CustomerOrderSummary = {
  id: string
  status: 'PENDING_PAYMENT' | 'PAYMENT_CONFIRMED' | 'EXPIRED'
  totalCents: number
  createdAt: string
}

export type CustomerDetail = CustomerSummary & {
  orders: CustomerOrderSummary[]
}

export type CustomerFilters = {
  /** Case-insensitive partial match on the e-mail. */
  email?: string
  status?: CustomerStatus
}

export type CustomerQuery = {
  page: number
  pageSize: number
  filters: CustomerFilters
}

export type CustomerPageResult = {
  customers: CustomerSummary[]
  page: number
  pageSize: number
  total: number
}

export class CustomerQueryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomerQueryValidationError'
  }
}

const supportedKeys = ['page', 'pageSize', 'email', 'status']
const maxEmailFilterLength = 254

export function isCustomerStatus(value: string): value is CustomerStatus {
  return (
    value === 'ACTIVE' ||
    value === 'INACTIVE' ||
    value === 'SUSPENDED' ||
    value === 'PENDING'
  )
}

function parseInteger(
  params: URLSearchParams,
  key: string,
  fallback: number,
  max: number,
) {
  const value = params.get(key)
  if (value === null) return fallback
  if (!/^\d+$/.test(value))
    throw new CustomerQueryValidationError('Invalid pagination parameters.')
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max)
    throw new CustomerQueryValidationError('Invalid pagination parameters.')
  return parsed
}

export function parseCustomerQuery(params: URLSearchParams): CustomerQuery {
  for (const key of params.keys()) {
    if (!supportedKeys.includes(key))
      throw new CustomerQueryValidationError(
        'Unsupported customer query parameter.',
      )
    if (params.getAll(key).length !== 1)
      throw new CustomerQueryValidationError(
        'Duplicate customer query parameter.',
      )
  }

  const filters: CustomerFilters = {}
  const email = params.get('email')
  if (email !== null) {
    const normalized = email.trim().toLowerCase()
    if (!normalized || normalized.length > maxEmailFilterLength)
      throw new CustomerQueryValidationError('Invalid e-mail filter.')
    filters.email = normalized
  }
  const status = params.get('status')
  if (status !== null) {
    if (!isCustomerStatus(status))
      throw new CustomerQueryValidationError('Invalid customer status filter.')
    filters.status = status
  }

  return {
    page: parseInteger(params, 'page', 1, 1_000_000),
    pageSize: parseInteger(params, 'pageSize', 20, 100),
    filters,
  }
}

/** Escapes LIKE wildcards so the e-mail filter is a literal substring. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}
