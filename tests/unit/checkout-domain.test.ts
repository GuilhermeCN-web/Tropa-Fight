import { describe, expect, it } from 'vitest'
import {
  allocateDiscountAcrossItems,
  calculateShipping,
  normalizeAddress,
  validCpf,
} from '../../src/modules/checkout/domain/checkout'

const validAddress = {
  recipientName: 'Maria Silva',
  cpf: '529.982.247-25',
  phone: '(11) 99999-1234',
  postalCode: '01310-100',
  street: 'Av. Paulista',
  number: '100',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'sp',
  country: 'br',
}

describe('checkout address and shipping rules', () => {
  it('validates CPF check digits and normalizes Brazilian contact/address codes', () => {
    expect(validCpf('52998224725')).toBe(true)
    expect(validCpf('11111111111')).toBe(false)
    expect(normalizeAddress(validAddress)).toMatchObject({
      cpf: '52998224725',
      phone: '11999991234',
      postalCode: '01310100',
      state: 'SP',
      country: 'BR',
    })
  })

  it('rejects invalid CPF, phone, postal code, and non-Brazilian destinations', () => {
    expect(() =>
      normalizeAddress({ ...validAddress, cpf: '12345678900' }),
    ).toThrow()
    expect(() =>
      normalizeAddress({ ...validAddress, phone: '123456789' }),
    ).toThrow()
    expect(() =>
      normalizeAddress({ ...validAddress, postalCode: '123' }),
    ).toThrow()
    expect(() => normalizeAddress({ ...validAddress, country: 'US' })).toThrow()
  })

  it('offers fixed STANDARD shipping and counts weekdays without a holiday calendar', () => {
    expect(
      calculateShipping('01310100', new Date('2026-11-02T12:00:00Z')),
    ).toEqual({
      method: 'STANDARD',
      shippingCents: 2000,
      estimatedBusinessDays: 5,
      estimatedDeliveryDate: '2026-11-09',
    })
  })

  it('allocates discount proportionally and resolves remainder cents deterministically', () => {
    const allocated = allocateDiscountAcrossItems(
      [
        { variantId: 'c', subtotalCents: 33 },
        { variantId: 'a', subtotalCents: 33 },
        { variantId: 'b', subtotalCents: 34 },
      ],
      10,
    )
    expect(allocated).toEqual(
      new Map([
        ['c', 3],
        ['a', 3],
        ['b', 4],
      ]),
    )

    const tied = allocateDiscountAcrossItems(
      [
        { variantId: 'b', subtotalCents: 1 },
        { variantId: 'a', subtotalCents: 1 },
      ],
      1,
    )
    expect(tied).toEqual(
      new Map([
        ['b', 0],
        ['a', 1],
      ]),
    )
    expect(() =>
      allocateDiscountAcrossItems(
        [{ variantId: 'only', subtotalCents: 10 }],
        11,
      ),
    ).toThrow()
  })
})
