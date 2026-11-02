import {
  normalizeDiscountType,
  normalizeDiscountValue,
  normalizeOptionalCents,
  normalizePromotionName,
  normalizePromotionPriority,
  normalizePromotionStatus,
  normalizeUtcDate,
  PromotionError,
  validatePromotionWindow,
  type Promotion,
  type PromotionApplicationType,
} from '../domain/promotion'
import type {
  CreatePromotionInput,
  PromotionRepository,
  UpdatePromotionInput,
} from './promotion-repository'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireUuid(value: string, label: string): string {
  if (!uuidPattern.test(value)) {
    throw new PromotionError(`${label} must be a valid UUID.`, 'VALIDATION')
  }
  return value
}

function normalizeApplicationType(value: unknown): PromotionApplicationType {
  if (value !== 'AUTOMATIC' && value !== 'COUPON') {
    throw new PromotionError(
      'Application type must be AUTOMATIC or COUPON.',
      'VALIDATION',
    )
  }
  return value
}

export class PromotionService {
  private readonly repository: PromotionRepository

  constructor(repository: PromotionRepository) {
    this.repository = repository
  }

  list() {
    return this.repository.list()
  }

  create(
    input: {
      name: unknown
      applicationType: unknown
      discountType: unknown
      discountValue: unknown
      minimumCartSubtotalCents?: unknown
      startsAt: unknown
      expiresAt?: unknown
      status?: unknown
      priority?: unknown
    },
    actorId: string,
  ) {
    const discountType = normalizeDiscountType(input.discountType)
    const startsAt = normalizeUtcDate(input.startsAt, 'Promotion start')
    const expiresAt =
      input.expiresAt === undefined || input.expiresAt === null
        ? null
        : normalizeUtcDate(input.expiresAt, 'Promotion expiration')
    validatePromotionWindow(startsAt, expiresAt)

    const normalized: CreatePromotionInput = {
      name: normalizePromotionName(input.name),
      applicationType: normalizeApplicationType(input.applicationType),
      discountType,
      discountValue: normalizeDiscountValue(discountType, input.discountValue),
      minimumCartSubtotalCents: normalizeOptionalCents(
        input.minimumCartSubtotalCents,
      ),
      startsAt,
      expiresAt,
      status:
        input.status === undefined
          ? 'DRAFT'
          : normalizePromotionStatus(input.status),
      priority:
        input.priority === undefined
          ? 0
          : normalizePromotionPriority(input.priority),
    }
    return this.repository.create(normalized, requireUuid(actorId, 'Actor ID'))
  }

  update(
    id: string,
    input: {
      name?: unknown
      discountType?: unknown
      discountValue?: unknown
      minimumCartSubtotalCents?: unknown
      startsAt?: unknown
      expiresAt?: unknown
      status?: unknown
      priority?: unknown
    },
    actorId: string,
  ): Promise<Promotion> {
    const normalized: UpdatePromotionInput = {}
    if (
      (input.discountType === undefined) !==
      (input.discountValue === undefined)
    ) {
      throw new PromotionError(
        'Discount type and value must be updated together.',
        'VALIDATION',
      )
    }
    if (input.name !== undefined) {
      normalized.name = normalizePromotionName(input.name)
    }
    if (input.discountType !== undefined && input.discountValue !== undefined) {
      const kind = normalizeDiscountType(input.discountType)
      normalized.discountType = kind
      normalized.discountValue = normalizeDiscountValue(
        kind,
        input.discountValue,
      )
    }
    if (input.minimumCartSubtotalCents !== undefined) {
      normalized.minimumCartSubtotalCents = normalizeOptionalCents(
        input.minimumCartSubtotalCents,
      )
    }
    if (input.startsAt !== undefined) {
      normalized.startsAt = normalizeUtcDate(input.startsAt, 'Promotion start')
    }
    if (input.expiresAt !== undefined) {
      normalized.expiresAt =
        input.expiresAt === null
          ? null
          : normalizeUtcDate(input.expiresAt, 'Promotion expiration')
    }
    if (input.status !== undefined) {
      normalized.status = normalizePromotionStatus(input.status)
    }
    if (input.priority !== undefined) {
      normalized.priority = normalizePromotionPriority(input.priority)
    }
    if (Object.keys(normalized).length === 0) {
      throw new PromotionError(
        'At least one promotion field is required.',
        'VALIDATION',
      )
    }
    return this.repository.update(
      requireUuid(id, 'Promotion ID'),
      normalized,
      requireUuid(actorId, 'Actor ID'),
    )
  }
}
