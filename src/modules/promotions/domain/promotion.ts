import type { DiscountKind } from '../../pricing/domain/discount'

export const promotionStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const
export type PromotionStatus = (typeof promotionStatuses)[number]
export type PromotionApplicationType = 'AUTOMATIC' | 'COUPON'

export type Promotion = {
  id: string
  name: string
  applicationType: PromotionApplicationType
  discountType: DiscountKind
  discountValue: number
  minimumCartSubtotalCents: number | null
  startsAt: string
  expiresAt: string | null
  status: PromotionStatus
  priority: number
  createdAt: string
  updatedAt: string
}

export class PromotionError extends Error {
  readonly code:
    | 'VALIDATION'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'INVALID_TRANSITION'
    | 'COUPON_NOT_FOUND'
    | 'COUPON_INACTIVE'
    | 'COUPON_NOT_STARTED'
    | 'COUPON_EXPIRED'
    | 'COUPON_USAGE_LIMIT_REACHED'
    | 'COUPON_CUSTOMER_LIMIT_REACHED'
    | 'COUPON_NOT_ELIGIBLE'
    | 'COUPON_MINIMUM_AMOUNT_NOT_MET'
    | 'COUPON_NOT_APPLICABLE'

  constructor(message: string, code: PromotionError['code']) {
    super(message)
    this.code = code
    this.name = 'PromotionError'
  }
}

export function normalizePromotionName(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.trim().length < 1 ||
    value.trim().length > 100
  ) {
    throw new PromotionError(
      'Promotion name must contain 1 to 100 characters.',
      'VALIDATION',
    )
  }
  return value.trim()
}

export function normalizeDiscountType(value: unknown): DiscountKind {
  if (value !== 'PERCENTAGE' && value !== 'FIXED_AMOUNT') {
    throw new PromotionError(
      'Discount type must be PERCENTAGE or FIXED_AMOUNT.',
      'VALIDATION',
    )
  }
  return value
}

export function normalizeDiscountValue(
  kind: DiscountKind,
  value: unknown,
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new PromotionError('Discount value must be an integer.', 'VALIDATION')
  }
  if (kind === 'PERCENTAGE' ? value < 1 || value > 100 : value <= 0) {
    throw new PromotionError(
      kind === 'PERCENTAGE'
        ? 'Percentage must be between 1 and 100.'
        : 'Fixed discount must be greater than zero.',
      'VALIDATION',
    )
  }
  return value
}

export function normalizeOptionalCents(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new PromotionError(
      'Minimum subtotal must be non-negative centavos.',
      'VALIDATION',
    )
  }
  return value
}

export function normalizePromotionStatus(value: unknown): PromotionStatus {
  if (value !== 'DRAFT' && value !== 'ACTIVE' && value !== 'INACTIVE') {
    throw new PromotionError(
      'Status must be DRAFT, ACTIVE, or INACTIVE.',
      'VALIDATION',
    )
  }
  return value
}

export function normalizePromotionPriority(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new PromotionError(
      'Promotion priority must be a non-negative safe integer.',
      'VALIDATION',
    )
  }
  return value
}

export function normalizeUtcDate(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    throw new PromotionError(
      `${label} must be an ISO timestamp with timezone.`,
      'VALIDATION',
    )
  }
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    throw new PromotionError(`${label} must be a valid date.`, 'VALIDATION')
  }
  return date.toISOString()
}

export function validatePromotionWindow(
  startsAt: string,
  expiresAt: string | null,
): void {
  if (
    expiresAt !== null &&
    new Date(expiresAt).getTime() <= new Date(startsAt).getTime()
  ) {
    throw new PromotionError(
      'Promotion expiration must be later than its start.',
      'VALIDATION',
    )
  }
}

export function isWithinPromotionWindow(
  startsAt: string,
  expiresAt: string | null,
  now: Date,
): boolean {
  return (
    new Date(startsAt).getTime() <= now.getTime() &&
    (expiresAt === null || now.getTime() < new Date(expiresAt).getTime())
  )
}
