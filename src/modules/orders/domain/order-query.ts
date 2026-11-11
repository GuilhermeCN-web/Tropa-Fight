import type { PaymentStatus } from '../../payments/domain/payment'

export type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_CONFIRMED' | 'EXPIRED'

export type OrderPage = { page: number; pageSize: number }

export type AdminOrderFilters = {
  status?: OrderStatus
  /** Inclusive lower bound of `createdAt`. */
  from?: Date
  /** Exclusive upper bound of `createdAt`. */
  to?: Date
}

export type AdminOrderQuery = { page: OrderPage; filters: AdminOrderFilters }

export type OrderListItem = {
  id: string
  status: OrderStatus
  createdAt: string
  subtotalCents: number
  discountCents: number
  discountLabel: string | null
  shippingCents: number
  totalCents: number
  currency: 'BRL'
  itemCount: number
  payment: {
    status: PaymentStatus
    method: 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD'
    amountCents: number
    currency: 'BRL'
    paidAt: string | null
  } | null
  shipment: {
    status: 'NOT_SHIPPED'
    method: 'STANDARD'
    shippingCents: number
    estimatedBusinessDays: number
    estimatedDeliveryDate: string
  } | null
}

export type OrderItemView = {
  id: string
  productName: string
  attributes: Record<string, unknown>
  unitPriceCents: number
  quantity: number
  subtotalCents: number
  discountCents: number
}

export type OrderShippingAddress = {
  recipientName: string
  postalCode: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  country: string
  complement?: string
  reference?: string
}

export type OrderDetail = OrderListItem & {
  updatedAt: string
  paymentDueAt: string
  couponCode: string | null
  address: OrderShippingAddress
  items: OrderItemView[]
  tracking: null
}

export type OrderPageResult = {
  orders: OrderListItem[]
  page: number
  pageSize: number
  total: number
}

export class OrderQueryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderQueryValidationError'
  }
}

const pageKeys = ['page', 'pageSize'] as const
const adminFilterKeys = ['status', 'from', 'to'] as const

function assertSupportedKeys(
  params: URLSearchParams,
  supported: readonly string[],
) {
  for (const key of params.keys()) {
    if (!supported.includes(key))
      throw new OrderQueryValidationError('Unsupported order query parameter.')
    if (params.getAll(key).length !== 1)
      throw new OrderQueryValidationError('Duplicate order query parameter.')
  }
}

export function parseOrderPage(params: URLSearchParams): OrderPage {
  assertSupportedKeys(params, pageKeys)
  return parsePagination(params)
}

/**
 * ISO-8601 date (`YYYY-MM-DD`, interpreted as 00:00 UTC) or date-time with an
 * explicit offset (`Z` or `±hh:mm`). Calendar-invalid values are rejected.
 */
const isoDatePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/

function parseIsoInstant(value: string): Date {
  const match = isoDatePattern.exec(value)
  if (!match) throw new OrderQueryValidationError('Invalid order date filter.')
  const [, year, month, day, hour] = match
  const parsed = new Date(hour === undefined ? `${value}T00:00:00Z` : value)
  if (Number.isNaN(parsed.getTime()))
    throw new OrderQueryValidationError('Invalid order date filter.')
  const calendar = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  )
  if (
    calendar.getUTCFullYear() !== Number(year) ||
    calendar.getUTCMonth() !== Number(month) - 1 ||
    calendar.getUTCDate() !== Number(day)
  )
    throw new OrderQueryValidationError('Invalid order date filter.')
  return parsed
}

export function parseAdminOrderQuery(params: URLSearchParams): AdminOrderQuery {
  assertSupportedKeys(params, [...pageKeys, ...adminFilterKeys])
  const filters: AdminOrderFilters = {}
  const status = params.get('status')
  if (status !== null) {
    if (!isOrderStatus(status))
      throw new OrderQueryValidationError('Invalid order status filter.')
    filters.status = status
  }
  const from = params.get('from')
  if (from !== null) filters.from = parseIsoInstant(from)
  const to = params.get('to')
  if (to !== null) filters.to = parseIsoInstant(to)
  if (filters.from && filters.to && filters.from >= filters.to)
    throw new OrderQueryValidationError(
      'Order date filter `from` must be earlier than `to`.',
    )
  return { page: parsePagination(params), filters }
}

function parsePagination(params: URLSearchParams): OrderPage {
  const parseInteger = (key: string, fallback: number, max: number) => {
    const value = params.get(key)
    if (value === null) return fallback
    if (!/^\d+$/.test(value))
      throw new OrderQueryValidationError('Invalid pagination parameters.')
    const parsed = Number(value)
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max)
      throw new OrderQueryValidationError('Invalid pagination parameters.')
    return parsed
  }

  return {
    page: parseInteger('page', 1, 1_000_000),
    pageSize: parseInteger('pageSize', 20, 100),
  }
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (
    value === 'PENDING_PAYMENT' ||
    value === 'PAYMENT_CONFIRMED' ||
    value === 'EXPIRED'
  )
}
