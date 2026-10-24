import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { IdentityPrincipal } from '../../src/modules/identity/domain/identity-user'
import { InventoryError } from '../../src/modules/inventory/domain/inventory'

vi.mock('../../src/infrastructure/database/pool', () => ({
  getDatabasePool: () => ({}),
}))
vi.mock('../../src/modules/auth/presentation/request-identity', () => ({
  requirePermission: vi.fn(),
}))

import { requirePermission } from '../../src/modules/auth/presentation/request-identity'
import { GET as getBalance } from '../../app/api/admin/inventory/[variantId]/route'
import { GET as getMovements } from '../../app/api/admin/inventory/[variantId]/movements/route'
import { POST as createEntry } from '../../app/api/admin/inventory/[variantId]/entries/route'
import { inventoryService } from '../../src/modules/inventory/presentation/http'

const variantId = '6e1294e7-8efb-4f2d-96fd-eed298d71dca'
const actorId = 'b76f41b1-b969-4be4-8d87-f7ef2b6aab10'

function request(path: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

function authorizedPrincipal(): IdentityPrincipal {
  return {
    id: actorId,
    email: 'stock-admin@example.invalid',
    accountType: 'ADMIN',
    status: 'ACTIVE',
    roles: ['GENERAL_ADMIN'],
    permissions: ['inventory.manage'],
    createdAt: new Date(0).toISOString(),
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.mocked(requirePermission).mockReset()
})

describe('inventory API', () => {
  it('requires authentication and inventory permission for reads and writes', async () => {
    vi.mocked(requirePermission).mockResolvedValue({ kind: 'unauthenticated' })
    expect(
      (
        await getBalance(request(`/api/admin/inventory/${variantId}`), {
          params: Promise.resolve({ variantId }),
        })
      )?.status,
    ).toBe(401)

    vi.mocked(requirePermission).mockResolvedValue({
      kind: 'forbidden',
      principal: authorizedPrincipal(),
    })
    const denied = await createEntry(
      request(`/api/admin/inventory/${variantId}/entries`, 'POST', {
        quantity: 1,
        reason: 'Restock',
      }),
      { params: Promise.resolve({ variantId }) },
    )
    expect(denied?.status).toBe(403)
  })

  it('returns the authorized balance and paginated movement history', async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      kind: 'authorized',
      principal: authorizedPrincipal(),
    })
    vi.spyOn(inventoryService, 'getBalance').mockResolvedValue({
      variantId,
      quantity: 7,
    })
    vi.spyOn(inventoryService, 'listMovements').mockResolvedValue({
      movements: [],
      total: 0,
    })

    const balance = await getBalance(
      request(`/api/admin/inventory/${variantId}`),
      { params: Promise.resolve({ variantId }) },
    )
    expect(balance?.status).toBe(200)
    expect(await balance?.json()).toEqual({
      inventory: { variantId, quantity: 7 },
    })

    const history = await getMovements(
      request(`/api/admin/inventory/${variantId}/movements?page=2&pageSize=5`),
      { params: Promise.resolve({ variantId }) },
    )
    expect(history?.status).toBe(200)
    expect(await history?.json()).toEqual({
      movements: [],
      total: 0,
      page: 2,
      pageSize: 5,
    })
  })

  it('validates movement requests and maps insufficient stock to conflict', async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      kind: 'authorized',
      principal: authorizedPrincipal(),
    })
    const invalid = await createEntry(
      request(`/api/admin/inventory/${variantId}/entries`, 'POST', {
        quantity: 0,
        reason: 'Restock',
      }),
      { params: Promise.resolve({ variantId }) },
    )
    expect(invalid?.status).toBe(400)
    const createMovement = vi.spyOn(inventoryService, 'createMovement')

    createMovement.mockResolvedValue({
      balance: { variantId, quantity: 1 },
      movement: {
        id: 'movement-id',
        variantId,
        actorId,
        type: 'ENTRY',
        quantity: 1,
        reason: 'Restock',
        createdAt: new Date(0).toISOString(),
      },
    })
    const created = await createEntry(
      request(`/api/admin/inventory/${variantId}/entries`, 'POST', {
        quantity: 1,
        reason: 'Restock',
      }),
      { params: Promise.resolve({ variantId }) },
    )
    expect(created?.status).toBe(201)

    createMovement.mockRejectedValue(
      new InventoryError('Insufficient stock.', 'INSUFFICIENT_STOCK'),
    )
    const insufficient = await createEntry(
      request(`/api/admin/inventory/${variantId}/entries`, 'POST', {
        quantity: 1,
        reason: 'Restock',
      }),
      { params: Promise.resolve({ variantId }) },
    )
    expect(insufficient?.status).toBe(409)
    expect(insufficient?.headers.get('Cache-Control')).toBe('no-store')
  })
})
