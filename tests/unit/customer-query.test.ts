import { describe, expect, it } from 'vitest'
import {
  CustomerQueryValidationError,
  escapeLikePattern,
  parseCustomerQuery,
} from '../../src/modules/customers/domain/customer-query'

describe('customer query domain (TASK-018, RF-034)', () => {
  it('uses default pagination and normalizes the e-mail filter', () => {
    expect(parseCustomerQuery(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 20,
      filters: {},
    })
    expect(
      parseCustomerQuery(
        new URLSearchParams(
          'email=  Ana@Example.TEST &status=SUSPENDED&pageSize=5',
        ),
      ),
    ).toEqual({
      page: 1,
      pageSize: 5,
      filters: { email: 'ana@example.test', status: 'SUSPENDED' },
    })
  })

  it.each([
    'status=BANNED',
    'status=active',
    'email=',
    'email=%20',
    `email=${'a'.repeat(255)}`,
    'page=0',
    'pageSize=101',
    'page=1.5',
    'status=ACTIVE&status=PENDING',
    'cpf=52998224725',
    'phone=11999999999',
  ])('rejects unsupported or invalid customer query: %s', (query) => {
    expect(() => parseCustomerQuery(new URLSearchParams(query))).toThrow(
      CustomerQueryValidationError,
    )
  })

  it('escapes LIKE wildcards so the filter is a literal substring', () => {
    expect(escapeLikePattern('a_b%c\\d')).toBe('a\\_b\\%c\\\\d')
  })
})
