import { describe, expect, it } from 'vitest'
import {
  AdminAccountError,
  assertKeepsAGeneralAdmin,
  normalizeAdminAccountChange,
  normalizeNewAdminAccount,
} from '../../src/modules/identity/domain/admin-account'

const password = 'Tropa#2026x'

describe('administrative account domain (TASK-019, RF-038)', () => {
  it('normalizes a new account with one administrative role', () => {
    expect(
      normalizeNewAdminAccount({
        email: '  Ana@Example.TEST ',
        password,
        role: 'CATALOG_MANAGER',
      }),
    ).toEqual({ email: 'ana@example.test', password, role: 'CATALOG_MANAGER' })
  })

  it.each([
    [{ email: 'a@b.test', password, role: 'CUSTOMER' }],
    [{ email: 'a@b.test', password, role: ['GENERAL_ADMIN'] }],
    [{ email: 'a@b.test', password: 'short1!', role: 'GENERAL_ADMIN' }],
    [{ email: 'invalid', password, role: 'GENERAL_ADMIN' }],
    [{ email: 'a@b.test', password }],
    [{ email: 'a@b.test', password, role: 'GENERAL_ADMIN', status: 'ACTIVE' }],
    [null],
    [[]],
  ])('rejects invalid new accounts: %j', (input) => {
    expect(() => normalizeNewAdminAccount(input)).toThrow(AdminAccountError)
  })

  it('accepts status and/or role changes only', () => {
    expect(normalizeAdminAccountChange({ status: 'INACTIVE' })).toEqual({
      status: 'INACTIVE',
    })
    expect(
      normalizeAdminAccountChange({ status: 'ACTIVE', role: 'GENERAL_ADMIN' }),
    ).toEqual({ status: 'ACTIVE', role: 'GENERAL_ADMIN' })
    for (const input of [
      {},
      { status: 'SUSPENDED' },
      { role: 'CUSTOMER' },
      { email: 'x@y.test' },
      { password },
    ])
      expect(() => normalizeAdminAccountChange(input)).toThrow(
        AdminAccountError,
      )
  })

  describe('RN-022: last active GENERAL_ADMIN', () => {
    const lastAdmin = { status: 'ACTIVE', role: 'GENERAL_ADMIN' } as const

    it.each([
      [{ status: 'INACTIVE' }],
      [{ role: 'CATALOG_MANAGER' }],
      [{ status: 'INACTIVE', role: 'CATALOG_MANAGER' }],
    ] as const)(
      'blocks %j when no other active GENERAL_ADMIN exists',
      (change) => {
        expect(() => assertKeepsAGeneralAdmin(lastAdmin, change, 0)).toThrow(
          expect.objectContaining({ code: 'LAST_GENERAL_ADMIN' }),
        )
      },
    )

    it('allows the change when another active GENERAL_ADMIN exists', () => {
      expect(() =>
        assertKeepsAGeneralAdmin(lastAdmin, { status: 'INACTIVE' }, 1),
      ).not.toThrow()
    })

    it('allows no-op changes and changes to other accounts', () => {
      expect(() =>
        assertKeepsAGeneralAdmin(
          lastAdmin,
          { status: 'ACTIVE', role: 'GENERAL_ADMIN' },
          0,
        ),
      ).not.toThrow()
      expect(() =>
        assertKeepsAGeneralAdmin(
          { status: 'ACTIVE', role: 'CATALOG_MANAGER' },
          { status: 'INACTIVE' },
          0,
        ),
      ).not.toThrow()
      expect(() =>
        assertKeepsAGeneralAdmin(
          { status: 'INACTIVE', role: 'GENERAL_ADMIN' },
          { role: 'CATALOG_MANAGER' },
          0,
        ),
      ).not.toThrow()
    })
  })
})
