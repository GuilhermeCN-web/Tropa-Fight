import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { CartError } from '../domain/cart'
import { CartService } from '../application/cart-service'
import { PostgresCartRepository } from '../infrastructure/postgres-cart-repository'

const cartService = new CartService(new PostgresCartRepository())
const permission = 'identity.profile.read:self'

async function authorizeCustomer(
  request: NextRequest,
): Promise<{ customerId: string } | { response: NextResponse }> {
  const access = await requirePermission(request, permission)
  if (
    access.kind === 'authorized' &&
    access.principal.accountType === 'CUSTOMER'
  ) {
    return { customerId: access.principal.id }
  }
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

function cartErrorResponse(error: unknown) {
  if (error instanceof CartError) {
    const status =
      error.code === 'VALIDATION'
        ? 400
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT'
            ? 409
            : 409
    return NextResponse.json(
      { error: error.message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(
    { error: 'Unable to complete cart operation.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}

async function readBody(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export async function getCart(request: NextRequest) {
  const access = await authorizeCustomer(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { cart: await cartService.get(access.customerId) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return cartErrorResponse(error)
  }
}

export async function addCartItem(request: NextRequest) {
  const access = await authorizeCustomer(request)
  if ('response' in access) return access.response
  const body = await readBody(request)
  if (
    !body ||
    Object.keys(body).some((key) => !['variantId', 'quantity'].includes(key))
  ) {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  try {
    return NextResponse.json(
      {
        cart: await cartService.addItem(
          access.customerId,
          body.variantId,
          body.quantity,
        ),
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return cartErrorResponse(error)
  }
}

export async function updateCartItem(request: NextRequest, itemId: string) {
  const access = await authorizeCustomer(request)
  if ('response' in access) return access.response
  const body = await readBody(request)
  if (!body || Object.keys(body).some((key) => key !== 'quantity')) {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  try {
    return NextResponse.json(
      {
        cart: await cartService.updateItem(
          access.customerId,
          itemId,
          body.quantity,
        ),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return cartErrorResponse(error)
  }
}

export async function removeCartItem(request: NextRequest, itemId: string) {
  const access = await authorizeCustomer(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { cart: await cartService.removeItem(access.customerId, itemId) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return cartErrorResponse(error)
  }
}
