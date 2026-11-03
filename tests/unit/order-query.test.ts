import { describe, expect, it } from 'vitest'
import {
  OrderQueryValidationError,
  parseOrderPage,
} from '../../src/modules/orders/domain/order-query'

describe('order query domain', () => {
  it('uses deterministic pagination defaults and accepts supported values', () => {
    expect(parseOrderPage(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 20,
    })
    expect(parseOrderPage(new URLSearchParams('page=3&pageSize=50'))).toEqual({
      page: 3,
      pageSize: 50,
    })
  })

  it.each([
    'page=0',
    'page=-1',
    'page=1.2',
    'page=1000001',
    'pageSize=0',
    'pageSize=101',
    'pageSize=1e2',
    'page=1&page=2',
    'sort=createdAt',
  ])('rejects unsupported or invalid pagination: %s', (query) => {
    expect(() => parseOrderPage(new URLSearchParams(query))).toThrow(
      OrderQueryValidationError,
    )
  })
})
