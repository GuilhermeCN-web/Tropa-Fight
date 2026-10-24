import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InventoryRepository } from '../../src/modules/inventory/application/inventory-repository'
import { InventoryService } from '../../src/modules/inventory/application/inventory-service'
import { InventoryError } from '../../src/modules/inventory/domain/inventory'

const repository = {
  getBalance: vi.fn(),
  listMovements: vi.fn(),
  createMovement: vi.fn(),
} satisfies InventoryRepository

beforeEach(() => {
  vi.resetAllMocks()
})

describe('inventory service', () => {
  it('validates pagination bounds before querying the repository', async () => {
    const service = new InventoryService(repository)
    expect(() =>
      service.listMovements('variant-id', { page: 0, pageSize: 20 }),
    ).toThrow(InventoryError)
    expect(() =>
      service.listMovements('variant-id', { page: 1, pageSize: 101 }),
    ).toThrow(InventoryError)
    expect(() =>
      service.listMovements('variant-id', {
        page: Number.MAX_SAFE_INTEGER,
        pageSize: 100,
      }),
    ).toThrow(InventoryError)
    expect(repository.listMovements).not.toHaveBeenCalled()
  })

  it('trims and requires a reason before recording a movement', async () => {
    const service = new InventoryService(repository)
    repository.createMovement.mockResolvedValue({
      balance: { variantId: 'variant-id', quantity: 1 },
      movement: {
        id: 'movement-id',
        variantId: 'variant-id',
        actorId: 'actor-id',
        type: 'ENTRY',
        quantity: 1,
        reason: 'Restock',
        createdAt: new Date(0).toISOString(),
      },
    })

    await service.createMovement({
      variantId: 'variant-id',
      actorId: 'actor-id',
      type: 'ENTRY',
      quantity: 1,
      reason: '  Restock  ',
    })
    expect(repository.createMovement).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'Restock' }),
    )
    expect(() =>
      service.createMovement({
        variantId: 'variant-id',
        actorId: 'actor-id',
        type: 'ENTRY',
        quantity: 1,
        reason: ' ',
      }),
    ).toThrow(InventoryError)
  })
})
