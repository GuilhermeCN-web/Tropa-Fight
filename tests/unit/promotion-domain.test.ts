import { describe, expect, it } from 'vitest'
import {
  isWithinPromotionWindow,
  normalizeDiscountType,
  normalizeDiscountValue,
  normalizePromotionPriority,
  normalizeUtcDate,
  PromotionError,
  validatePromotionWindow,
} from '../../src/modules/promotions/domain/promotion'

describe('promotion domain', () => {
  it('accepts only approved discount types and values', () => {
    expect(normalizeDiscountType('PERCENTAGE')).toBe('PERCENTAGE')
    expect(normalizeDiscountValue('PERCENTAGE', 100)).toBe(100)
    expect(normalizeDiscountValue('FIXED_AMOUNT', 1)).toBe(1)
    expect(() => normalizeDiscountType('FREE_SHIPPING')).toThrow(PromotionError)
    expect(() => normalizeDiscountValue('PERCENTAGE', 101)).toThrow(
      PromotionError,
    )
    expect(() => normalizeDiscountValue('FIXED_AMOUNT', 0)).toThrow(
      PromotionError,
    )
  })

  it('normalizes timezone-aware dates and uses an inclusive start/exclusive end', () => {
    const startsAt = normalizeUtcDate(
      '2026-10-26T12:00:00-03:00',
      'Promotion start',
    )
    const expiresAt = normalizeUtcDate(
      '2026-10-26T13:00:00-03:00',
      'Promotion expiration',
    )
    expect(startsAt).toBe('2026-10-26T15:00:00.000Z')
    expect(
      isWithinPromotionWindow(
        startsAt,
        expiresAt,
        new Date('2026-10-26T15:00:00.000Z'),
      ),
    ).toBe(true)
    expect(
      isWithinPromotionWindow(
        startsAt,
        expiresAt,
        new Date('2026-10-26T16:00:00.000Z'),
      ),
    ).toBe(false)
    expect(() => validatePromotionWindow(expiresAt, startsAt)).toThrow(
      PromotionError,
    )
  })

  it('accepts only non-negative safe integer priorities', () => {
    expect(normalizePromotionPriority(0)).toBe(0)
    expect(normalizePromotionPriority(10)).toBe(10)
    expect(() => normalizePromotionPriority(-1)).toThrow(PromotionError)
    expect(() =>
      normalizePromotionPriority(Number.MAX_SAFE_INTEGER + 1),
    ).toThrow(PromotionError)
  })
})
