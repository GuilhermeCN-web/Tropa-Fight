import { CartError, validateQuantity } from '../domain/cart'
import type { CartRepository } from './cart-repository'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new CartError(`${label} must be a valid UUID.`, 'VALIDATION')
  }
  return value
}

export class CartService {
  private readonly repository: CartRepository

  constructor(repository: CartRepository) {
    this.repository = repository
  }

  get(customerId: string) {
    return this.repository.getOrCreate(requireUuid(customerId, 'Customer ID'))
  }

  addItem(customerId: string, variantId: unknown, quantity: unknown) {
    return this.repository.addItem(
      requireUuid(customerId, 'Customer ID'),
      requireUuid(variantId, 'Variant ID'),
      validateQuantity(quantity),
    )
  }

  updateItem(customerId: string, itemId: unknown, quantity: unknown) {
    return this.repository.updateItem(
      requireUuid(customerId, 'Customer ID'),
      requireUuid(itemId, 'Cart item ID'),
      validateQuantity(quantity),
    )
  }

  removeItem(customerId: string, itemId: unknown) {
    return this.repository.removeItem(
      requireUuid(customerId, 'Customer ID'),
      requireUuid(itemId, 'Cart item ID'),
    )
  }
}
