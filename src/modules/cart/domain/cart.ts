export type CartItem = {
  id: string
  variantId: string
  productName: string
  attributes: { size?: string; color?: string }
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  availableQuantity: number
  createdAt: string
  updatedAt: string
}

export type Cart = {
  id: string
  items: CartItem[]
  totalItems: number
  subtotalCents: number
  createdAt: string
  updatedAt: string
}

export type CartErrorCode =
  'VALIDATION' | 'NOT_FOUND' | 'UNAVAILABLE' | 'INSUFFICIENT_STOCK' | 'CONFLICT'

export class CartError extends Error {
  readonly code: CartErrorCode

  constructor(message: string, code: CartErrorCode) {
    super(message)
    this.code = code
    this.name = 'CartError'
  }
}

export function validateQuantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new CartError(
      'Quantity must be a positive safe integer.',
      'VALIDATION',
    )
  }
  return value
}

export function calculateItemSubtotal(
  unitPriceCents: number,
  quantity: number,
): number {
  const subtotal = unitPriceCents * quantity
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) {
    throw new CartError(
      'Item subtotal exceeds the supported range.',
      'VALIDATION',
    )
  }
  return subtotal
}

export function calculateCartTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0)
  if (
    !Number.isSafeInteger(totalItems) ||
    !Number.isSafeInteger(subtotalCents)
  ) {
    throw new CartError('Cart totals exceed the supported range.', 'VALIDATION')
  }
  return { totalItems, subtotalCents }
}
