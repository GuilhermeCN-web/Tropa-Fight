import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { InventoryService } from '../application/inventory-service'
import { PostgresInventoryRepository } from '../infrastructure/postgres-inventory-repository'
import { InventoryError, type InventoryMovementType } from '../domain/inventory'

const permission = 'inventory.manage'
const variantIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const inventoryService = new InventoryService(
  new PostgresInventoryRepository(),
)

export async function authorizeInventory(request: NextRequest) {
  const access = await requirePermission(request, permission)
  if (access.kind === 'authorized') return { principalId: access.principal.id }
  return {
    response: NextResponse.json(
      {
        error:
          access.kind === 'unauthenticated'
            ? 'Authentication required.'
            : 'Permission denied.',
      },
      {
        status: access.kind === 'unauthenticated' ? 401 : 403,
        headers: { 'Cache-Control': 'no-store' },
      },
    ),
  }
}

function invalidIdResponse() {
  return NextResponse.json(
    { error: 'Invalid variant ID.' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  )
}

function inventoryErrorResponse(error: unknown) {
  if (error instanceof InventoryError) {
    const status =
      error.code === 'VALIDATION' ? 400 : error.code === 'NOT_FOUND' ? 404 : 409
    return NextResponse.json(
      { error: error.message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(
    { error: 'Unable to complete inventory operation.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}

async function readObject(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null
    return body as Record<string, unknown>
  } catch {
    return null
  }
}

function hasOnlyKeys(body: Record<string, unknown>, keys: string[]) {
  return Object.keys(body).every((key) => keys.includes(key))
}

function invalidBodyResponse() {
  return NextResponse.json(
    { error: 'Invalid request body.' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function getInventoryBalance(
  request: NextRequest,
  variantId: string,
) {
  const access = await authorizeInventory(request)
  if ('response' in access) return access.response
  if (!variantIdPattern.test(variantId)) return invalidIdResponse()
  try {
    return NextResponse.json(
      { inventory: await inventoryService.getBalance(variantId) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}

export async function getInventoryMovements(
  request: NextRequest,
  variantId: string,
) {
  const access = await authorizeInventory(request)
  if ('response' in access) return access.response
  if (!variantIdPattern.test(variantId)) return invalidIdResponse()
  const pageValue = new URL(request.url).searchParams.get('page')
  const pageSizeValue = new URL(request.url).searchParams.get('pageSize')
  const page = pageValue === null ? 1 : Number(pageValue)
  const pageSize = pageSizeValue === null ? 20 : Number(pageSizeValue)
  try {
    const result = await inventoryService.listMovements(variantId, {
      page,
      pageSize,
    })
    return NextResponse.json(
      { ...result, page, pageSize },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}

export async function createInventoryMovement(
  request: NextRequest,
  variantId: string,
  type: InventoryMovementType,
) {
  const access = await authorizeInventory(request)
  if ('response' in access) return access.response
  if (!variantIdPattern.test(variantId)) return invalidIdResponse()
  const body = await readObject(request)
  if (
    !body ||
    !hasOnlyKeys(body, ['quantity', 'reason']) ||
    typeof body.quantity !== 'number' ||
    typeof body.reason !== 'string'
  ) {
    return invalidBodyResponse()
  }
  try {
    const result = await inventoryService.createMovement({
      variantId,
      actorId: access.principalId,
      type,
      quantity: body.quantity,
      reason: body.reason,
    })
    return NextResponse.json(result, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}
