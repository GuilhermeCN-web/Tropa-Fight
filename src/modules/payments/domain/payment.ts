export const paymentMethods = ['PIX', 'DEBIT_CARD', 'CREDIT_CARD'] as const
export type PaymentMethod = (typeof paymentMethods)[number]

export const paymentStatuses = [
  'PENDING',
  'PROCESSING',
  'APPROVED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export const paymentEventTypes = [
  'payment.processing',
  'payment.approved',
  'payment.failed',
  'payment.cancelled',
  'payment.expired',
] as const
export type PaymentEventType = (typeof paymentEventTypes)[number]

export type Payment = {
  id: string
  orderId: string
  provider: 'LOCAL_MOCK'
  providerPaymentId: string
  method: PaymentMethod
  amountCents: number
  currency: 'BRL'
  status: PaymentStatus
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

export type PaymentWebhookEvent = {
  id: string
  type: PaymentEventType
  paymentId: string
  orderId: string
  amountCents: number
  currency: 'BRL'
  occurredAt: string
}

export type CreatePaymentInput = {
  orderId: string
  method: PaymentMethod
}

export type PaymentErrorCode =
  'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'EXPIRED' | 'CONFIGURATION'

export class PaymentError extends Error {
  readonly code: PaymentErrorCode

  constructor(message: string, code: PaymentErrorCode) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const eventIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/

export function normalizeCreatePaymentInput(
  input: unknown,
): CreatePaymentInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PaymentError('Request body must be an object.', 'VALIDATION')
  }
  const value = input as Record<string, unknown>
  const method = paymentMethods.find((item) => item === value.method)
  if (
    Object.keys(value).some((key) => !['orderId', 'method'].includes(key)) ||
    typeof value.orderId !== 'string' ||
    !uuidPattern.test(value.orderId) ||
    !method
  ) {
    throw new PaymentError('Invalid payment request.', 'VALIDATION')
  }
  return {
    orderId: value.orderId,
    method,
  }
}

export function parsePaymentWebhookEvent(rawBody: string): PaymentWebhookEvent {
  let input: unknown
  try {
    input = JSON.parse(rawBody)
  } catch {
    throw new PaymentError('Webhook body must be valid JSON.', 'VALIDATION')
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PaymentError('Webhook body must be an object.', 'VALIDATION')
  }
  const value = input as Record<string, unknown>
  const type = paymentEventTypes.find((item) => item === value.type)
  const keys = [
    'id',
    'type',
    'paymentId',
    'orderId',
    'amountCents',
    'currency',
    'occurredAt',
  ]
  if (
    Object.keys(value).some((key) => !keys.includes(key)) ||
    keys.some((key) => !(key in value)) ||
    typeof value.id !== 'string' ||
    !eventIdPattern.test(value.id) ||
    !type ||
    typeof value.paymentId !== 'string' ||
    !uuidPattern.test(value.paymentId) ||
    typeof value.orderId !== 'string' ||
    !uuidPattern.test(value.orderId) ||
    typeof value.amountCents !== 'number' ||
    !Number.isSafeInteger(value.amountCents) ||
    value.amountCents <= 0 ||
    value.currency !== 'BRL' ||
    typeof value.occurredAt !== 'string' ||
    !Number.isFinite(Date.parse(value.occurredAt))
  ) {
    throw new PaymentError('Invalid payment webhook payload.', 'VALIDATION')
  }
  return {
    id: value.id,
    type,
    paymentId: value.paymentId,
    orderId: value.orderId,
    amountCents: value.amountCents,
    currency: 'BRL',
    occurredAt: value.occurredAt,
  }
}

export function statusForPaymentEvent(type: PaymentEventType): PaymentStatus {
  switch (type) {
    case 'payment.processing':
      return 'PROCESSING'
    case 'payment.approved':
      return 'APPROVED'
    case 'payment.failed':
      return 'FAILED'
    case 'payment.cancelled':
      return 'CANCELLED'
    case 'payment.expired':
      return 'EXPIRED'
  }
}

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return (
    status === 'APPROVED' ||
    status === 'FAILED' ||
    status === 'CANCELLED' ||
    status === 'EXPIRED'
  )
}

export function canTransitionPayment(
  current: PaymentStatus,
  next: PaymentStatus,
): boolean {
  return (
    (current === 'PENDING' && next === 'PROCESSING') ||
    (current === 'PROCESSING' && isTerminalPaymentStatus(next))
  )
}
