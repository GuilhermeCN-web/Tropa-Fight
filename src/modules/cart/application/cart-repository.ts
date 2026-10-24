import type { Cart } from '../domain/cart'

export interface CartRepository {
  getOrCreate(customerId: string): Promise<Cart>
  addItem(
    customerId: string,
    variantId: string,
    quantity: number,
  ): Promise<Cart>
  updateItem(
    customerId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart>
  removeItem(customerId: string, itemId: string): Promise<Cart>
}
