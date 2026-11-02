import { describe, expect, it } from 'vitest'
import {
  calculateDiscountAmount,
  selectBestDiscount,
  type DiscountCandidate,
} from '../../src/modules/pricing/domain/discount'

describe('discount calculation', () => {
  it('calculates percentages in integer cents and rounds half up', () => {
    expect(calculateDiscountAmount(10_000, 'PERCENTAGE', 10)).toBe(1_000)
    expect(calculateDiscountAmount(1, 'PERCENTAGE', 50)).toBe(1)
    expect(calculateDiscountAmount(3, 'PERCENTAGE', 50)).toBe(2)
    expect(calculateDiscountAmount(1, 'PERCENTAGE', 1)).toBe(0)
  })

  it('caps fixed discounts at the cart subtotal', () => {
    expect(calculateDiscountAmount(5_000, 'FIXED_AMOUNT', 2_500)).toBe(2_500)
    expect(calculateDiscountAmount(5_000, 'FIXED_AMOUNT', 8_000)).toBe(5_000)
    expect(calculateDiscountAmount(0, 'FIXED_AMOUNT', 1)).toBe(0)
  })

  it('rejects invalid monetary inputs and unsupported percentages', () => {
    expect(() => calculateDiscountAmount(-1, 'FIXED_AMOUNT', 1)).toThrow()
    expect(() =>
      calculateDiscountAmount(Number.MAX_SAFE_INTEGER + 1, 'PERCENTAGE', 10),
    ).toThrow()
    expect(() => calculateDiscountAmount(100, 'PERCENTAGE', 101)).toThrow()
    expect(() => calculateDiscountAmount(100, 'FIXED_AMOUNT', 0)).toThrow()
  })

  it('selects one largest discount with deterministic tie breaking', () => {
    const candidates: DiscountCandidate[] = [
      {
        id: 'coupon',
        source: 'COUPON',
        kind: 'PERCENTAGE',
        value: 10,
        priority: 100,
        label: 'TROPA10',
      },
      {
        id: 'automatic',
        source: 'PROMOTION',
        kind: 'FIXED_AMOUNT',
        value: 1_000,
        priority: 0,
        label: 'Automatic',
      },
    ]
    expect(selectBestDiscount(10_000, candidates)).toMatchObject({
      source: 'PROMOTION',
      id: 'automatic',
      amountCents: 1_000,
    })
    expect(
      selectBestDiscount(10_000, [
        { ...candidates[1], id: 'z-promo', priority: 1 },
        { ...candidates[1], id: 'a-promo', priority: 1 },
      ]),
    ).toMatchObject({ id: 'a-promo' })
    expect(selectBestDiscount(0, candidates)).toBeNull()
  })
})
