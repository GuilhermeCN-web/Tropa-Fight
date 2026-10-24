import type {
  InventoryBalance,
  InventoryMovement,
  InventoryMovementType,
} from '../domain/inventory'

export type InventoryMovementPage = {
  page: number
  pageSize: number
}

export interface InventoryRepository {
  getBalance(variantId: string): Promise<InventoryBalance>
  listMovements(
    variantId: string,
    page: InventoryMovementPage,
  ): Promise<{ movements: InventoryMovement[]; total: number }>
  createMovement(input: {
    variantId: string
    actorId: string
    type: InventoryMovementType
    quantity: number
    reason: string
  }): Promise<{ balance: InventoryBalance; movement: InventoryMovement }>
}
