import { describe, expect, it } from 'vitest'
import {
  InventoryError,
  validateMovementInput,
} from '../../src/modules/inventory/domain/inventory'

describe('inventory movement domain', () => {
  it('accepts positive entry and exit quantities and signed adjustment deltas', () => {
    expect(() => validateMovementInput('ENTRY', 4, 'Restock')).not.toThrow()
    expect(() => validateMovementInput('EXIT', 2, 'Damaged item')).not.toThrow()
    expect(() =>
      validateMovementInput('ADJUSTMENT', -1, 'Stock count'),
    ).not.toThrow()
    expect(() =>
      validateMovementInput('ADJUSTMENT', 3, 'Stock count'),
    ).not.toThrow()
  })

  it('rejects zero, fractional, and unsafe quantities', () => {
    expect(() => validateMovementInput('ENTRY', 0, 'Restock')).toThrow(
      InventoryError,
    )
    expect(() => validateMovementInput('EXIT', -1, 'Correction')).toThrow(
      InventoryError,
    )
    expect(() => validateMovementInput('ADJUSTMENT', 0, 'Count')).toThrow(
      InventoryError,
    )
    expect(() =>
      validateMovementInput('ENTRY', Number.MAX_SAFE_INTEGER + 1, 'Restock'),
    ).toThrow(InventoryError)
  })

  it('requires a nonblank reason for every movement', () => {
    expect(() => validateMovementInput('ENTRY', 1, '  ')).toThrow(
      InventoryError,
    )
  })
})
