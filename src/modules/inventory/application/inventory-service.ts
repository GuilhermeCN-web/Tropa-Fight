import {
  InventoryError,
  validateMovementInput,
  type InventoryMovementType,
} from '../domain/inventory'
import type {
  InventoryMovementPage,
  InventoryRepository,
} from './inventory-repository'

const maxPageSize = 100

export class InventoryService {
  private readonly repository: InventoryRepository

  constructor(repository: InventoryRepository) {
    this.repository = repository
  }

  getBalance(variantId: string) {
    return this.repository.getBalance(variantId)
  }

  listMovements(variantId: string, page: InventoryMovementPage) {
    if (
      !Number.isSafeInteger(page.page) ||
      page.page < 1 ||
      !Number.isSafeInteger(page.pageSize) ||
      page.pageSize < 1 ||
      page.pageSize > maxPageSize ||
      !Number.isSafeInteger((page.page - 1) * page.pageSize)
    ) {
      throw new InventoryError('Invalid pagination.', 'VALIDATION')
    }
    return this.repository.listMovements(variantId, page)
  }

  createMovement(input: {
    variantId: string
    actorId: string
    type: InventoryMovementType
    quantity: number
    reason: string
  }) {
    validateMovementInput(input.type, input.quantity, input.reason)
    return this.repository.createMovement({
      ...input,
      reason: input.reason.trim(),
    })
  }
}
