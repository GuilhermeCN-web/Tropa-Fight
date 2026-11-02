import {
  normalizePromotionStatus,
  PromotionError,
  type PromotionStatus,
} from '../../promotions/domain/promotion'

export type Coupon = {
  id: string
  promotionId: string
  code: string
  status: PromotionStatus
  usageLimit: number | null
  usageLimitPerCustomer: number | null
  createdAt: string
  updatedAt: string
}

export function normalizeCouponCode(value: unknown): string {
  if (typeof value !== 'string') {
    throw new PromotionError('Coupon code is required.', 'VALIDATION')
  }
  const trimmed = value.trim()
  if (!/^[A-Za-z0-9]{1,50}$/.test(trimmed)) {
    throw new PromotionError(
      'Coupon code must contain only letters A-Z and digits.',
      'VALIDATION',
    )
  }
  return trimmed.toUpperCase()
}

export function normalizeUsageLimit(
  value: unknown,
  label: string,
): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new PromotionError(
      `${label} must be a positive safe integer or null.`,
      'VALIDATION',
    )
  }
  return value
}

export function normalizeCouponStatus(value: unknown): PromotionStatus {
  return normalizePromotionStatus(value)
}
