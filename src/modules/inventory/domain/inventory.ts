export const inventoryMovementTypes = ['ENTRY', 'EXIT', 'ADJUSTMENT'] as const

export type InventoryMovementType = (typeof inventoryMovementTypes)[number]

export type InventoryBalance = {
  variantId: string
  quantity: number
}

export type InventoryMovement = {
  id: string
  variantId: string
  actorId: string
  type: InventoryMovementType
  quantity: number
  reason: string
  createdAt: string
}

export type InventoryErrorCode =
  'VALIDATION' | 'NOT_FOUND' | 'INSUFFICIENT_STOCK'

export class InventoryError extends Error {
  readonly code: InventoryErrorCode

  constructor(message: string, code: InventoryErrorCode) {
    super(message)
    this.code = code
    this.name = 'InventoryError'
  }
}

export function validateMovementInput(
  type: InventoryMovementType,
  quantity: number,
  reason: string,
): void {
  if (!Number.isSafeInteger(quantity)) {
    throw new InventoryError('Quantity must be a safe integer.', 'VALIDATION')
  }
  if (type === 'ADJUSTMENT' ? quantity === 0 : quantity <= 0) {
    throw new InventoryError(
      type === 'ADJUSTMENT'
        ? 'Adjustment delta must not be zero.'
        : 'Quantity must be greater than zero.',
      'VALIDATION',
    )
  }
  if (!reason.trim()) {
    throw new InventoryError('Reason is required.', 'VALIDATION')
  }
}
