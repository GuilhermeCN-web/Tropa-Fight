import {
  normalizeCouponCode,
  normalizeCouponStatus,
  normalizeUsageLimit,
} from '../domain/coupon'
import { PromotionError } from '../../promotions/domain/promotion'
import type { Coupon } from '../domain/coupon'
import type {
  CouponRepository,
  CreateCouponInput,
  UpdateCouponInput,
} from './coupon-repository'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new PromotionError(`${label} must be a valid UUID.`, 'VALIDATION')
  }
  return value
}

export class CouponService {
  private readonly repository: CouponRepository

  constructor(repository: CouponRepository) {
    this.repository = repository
  }

  list() {
    return this.repository.list()
  }

  create(
    input: {
      promotionId: unknown
      code: unknown
      status?: unknown
      usageLimit?: unknown
      usageLimitPerCustomer?: unknown
    },
    actorId: string,
  ) {
    const normalized: CreateCouponInput = {
      promotionId: requireUuid(input.promotionId, 'Promotion ID'),
      code: normalizeCouponCode(input.code),
      status:
        input.status === undefined
          ? 'DRAFT'
          : normalizeCouponStatus(input.status),
      usageLimit: normalizeUsageLimit(input.usageLimit, 'Usage limit'),
      usageLimitPerCustomer: normalizeUsageLimit(
        input.usageLimitPerCustomer,
        'Per-customer usage limit',
      ),
    }
    return this.repository.create(normalized, requireUuid(actorId, 'Actor ID'))
  }

  update(
    id: string,
    input: {
      promotionId?: unknown
      code?: unknown
      status?: unknown
      usageLimit?: unknown
      usageLimitPerCustomer?: unknown
    },
    actorId: string,
  ): Promise<Coupon> {
    const normalized: UpdateCouponInput = {}
    if (input.promotionId !== undefined) {
      normalized.promotionId = requireUuid(input.promotionId, 'Promotion ID')
    }
    if (input.code !== undefined) {
      normalized.code = normalizeCouponCode(input.code)
    }
    if (input.status !== undefined) {
      normalized.status = normalizeCouponStatus(input.status)
    }
    if (input.usageLimit !== undefined) {
      normalized.usageLimit = normalizeUsageLimit(
        input.usageLimit,
        'Usage limit',
      )
    }
    if (input.usageLimitPerCustomer !== undefined) {
      normalized.usageLimitPerCustomer = normalizeUsageLimit(
        input.usageLimitPerCustomer,
        'Per-customer usage limit',
      )
    }
    if (Object.keys(normalized).length === 0) {
      throw new PromotionError(
        'At least one coupon field is required.',
        'VALIDATION',
      )
    }
    return this.repository.update(
      requireUuid(id, 'Coupon ID'),
      normalized,
      requireUuid(actorId, 'Actor ID'),
    )
  }
}
