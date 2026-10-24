import { describe, expect, it } from 'vitest'
import {
  calculateCartTotals,
  calculateItemSubtotal,
  CartError,
  validateQuantity,
  type CartItem,
} from '../../src/modules/cart/domain/cart'

const item: CartItem = {
  id: 'item',
  variantId: 'variant',
  productName: 'Product',
  attributes: { size: 'M' },
  quantity: 3,
  unitPriceCents: 7990,
  subtotalCents: 23970,
  availableQuantity: 2,
  createdAt: '2026-10-24T00:00:00.000Z',
  updatedAt: '2026-10-24T00:00:00.000Z',
}

describe('cart domain', () => {
  it('accepts only positive safe integer quantities', () => {
    expect(validateQuantity(1)).toBe(1)
    for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, null, '2']) {
      expect(() => validateQuantity(value)).toThrow(CartError)
    }
  })

  it('calculates item and cart totals in integer centavos', () => {
    expect(calculateItemSubtotal(7990, 3)).toBe(23970)
    expect(
      calculateCartTotals([
        item,
        { ...item, id: 'item-2', subtotalCents: 500 },
      ]),
    ).toEqual({
      totalItems: 6,
      subtotalCents: 24470,
    })
  })

  it('rejects unsafe monetary totals', () => {
    expect(() => calculateItemSubtotal(Number.MAX_SAFE_INTEGER, 2)).toThrow(
      'Item subtotal exceeds the supported range.',
    )
    expect(() =>
      calculateCartTotals([
        { ...item, subtotalCents: Number.MAX_SAFE_INTEGER },
        { ...item, id: 'item-2', subtotalCents: 1 },
      ]),
    ).toThrow('Cart totals exceed the supported range.')
  })
})
