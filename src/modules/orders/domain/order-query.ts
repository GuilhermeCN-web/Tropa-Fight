import type { PaymentStatus } from '../../payments/domain/payment'

export type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_CONFIRMED' | 'EXPIRED'

export type OrderPage = { page: number; pageSize: number }

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

export function parseOrderPage(params: URLSearchParams): OrderPage {
  for (const key of params.keys()) {
    if (key !== 'page' && key !== 'pageSize')
      throw new OrderQueryValidationError('Unsupported order query parameter.')
    if (params.getAll(key).length !== 1)
      throw new OrderQueryValidationError('Duplicate order query parameter.')
  }

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
