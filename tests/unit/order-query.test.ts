import { describe, expect, it } from 'vitest'
import {
  OrderQueryValidationError,
  parseAdminOrderQuery,
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

describe('admin order query filters (TASK-018, RF-033)', () => {
  it('accepts status, inclusive `from` and exclusive `to` together with pagination', () => {
    expect(
      parseAdminOrderQuery(
        new URLSearchParams(
          'status=PAYMENT_CONFIRMED&from=2026-11-01&to=2026-11-02T03:00:00-03:00&page=2',
        ),
      ),
    ).toEqual({
      page: { page: 2, pageSize: 20 },
      filters: {
        status: 'PAYMENT_CONFIRMED',
        from: new Date('2026-11-01T00:00:00.000Z'),
        to: new Date('2026-11-02T06:00:00.000Z'),
      },
    })
    expect(parseAdminOrderQuery(new URLSearchParams())).toEqual({
      page: { page: 1, pageSize: 20 },
      filters: {},
    })
  })

  it.each([
    'status=CANCELLED',
    'status=payment_confirmed',
    'from=2026-02-30',
    'from=2026-11-01T25:00:00Z',
    'from=2026-11-01T10:00:00',
    'to=11/01/2026',
    'from=2026-11-02&to=2026-11-02',
    'from=2026-11-03&to=2026-11-02',
    'from=2026-11-01&from=2026-11-02',
    'customerId=x',
  ])('rejects invalid admin filters: %s', (query) => {
    expect(() => parseAdminOrderQuery(new URLSearchParams(query))).toThrow(
      OrderQueryValidationError,
    )
  })

  it('keeps the customer history free of admin filters', () => {
    expect(() =>
      parseOrderPage(new URLSearchParams('status=PENDING_PAYMENT')),
    ).toThrow(OrderQueryValidationError)
  })
})
