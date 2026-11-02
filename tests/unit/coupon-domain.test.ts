import { describe, expect, it } from 'vitest'
import {
  normalizeCouponCode,
  normalizeCouponStatus,
  normalizeUsageLimit,
} from '../../src/modules/coupons/domain/coupon'
import { PromotionError } from '../../src/modules/promotions/domain/promotion'

describe('coupon domain', () => {
  it('normalizes codes before persistence and lookup', () => {
    expect(normalizeCouponCode('  tropa10  ')).toBe('TROPA10')
    expect(() => normalizeCouponCode('TROPA-10')).toThrow(PromotionError)
    expect(() => normalizeCouponCode('ß')).toThrow(PromotionError)
    expect(() => normalizeCouponCode('')).toThrow(PromotionError)
    expect(() => normalizeCouponCode(null)).toThrow(PromotionError)
  })

  it('accepts only approved statuses and positive optional limits', () => {
    expect(normalizeCouponStatus('ACTIVE')).toBe('ACTIVE')
    expect(normalizeUsageLimit(null, 'Usage limit')).toBeNull()
    expect(normalizeUsageLimit(1, 'Usage limit')).toBe(1)
    expect(() => normalizeCouponStatus('EXPIRED')).toThrow(PromotionError)
    for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1']) {
      expect(() => normalizeUsageLimit(value, 'Usage limit')).toThrow(
        PromotionError,
      )
    }
  })
})
