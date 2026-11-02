import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { CheckoutError } from '../domain/checkout'
import { PostgresCheckoutRepository } from '../infrastructure/postgres-checkout-repository'

const repository = new PostgresCheckoutRepository()
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function customer(request: NextRequest) {
  const access = await requirePermission(request, 'identity.profile.read:self')
  if (
    access.kind === 'authorized' &&
    access.principal.accountType === 'CUSTOMER'
  )
    return { id: access.principal.id }
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

async function readBody(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function errorResponse(error: unknown) {
  if (error instanceof CheckoutError) {
    const status =
      error.code === 'VALIDATION'
        ? 400
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT' ||
              error.code === 'QUOTE_CHANGED' ||
              error.code === 'STOCK_UNAVAILABLE' ||
              error.code === 'COUPON_INVALID'
            ? 409
            : 422
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(
    { error: 'Unable to complete checkout.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function createQuote(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  const body = await readBody(request)
  if (
    !body ||
    Object.keys(body).some((key) => key !== 'addressId') ||
    typeof body.addressId !== 'string' ||
    !uuidPattern.test(body.addressId)
  )
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  try {
    return NextResponse.json(
      { quote: await repository.createQuote(access.id, body.addressId) },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function createOrder(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  const body = await readBody(request)
  const key = request.headers.get('Idempotency-Key')
  if (
    !body ||
    Object.keys(body).some((item) => item !== 'quoteId') ||
    typeof body.quoteId !== 'string' ||
    !uuidPattern.test(body.quoteId) ||
    !key ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    )
  )
    return NextResponse.json(
      { error: 'A valid quoteId and Idempotency-Key are required.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  try {
    const result = await repository.createOrder(access.id, body.quoteId, key)
    if ('changedQuote' in result)
      return NextResponse.json(
        {
          code: 'QUOTE_CHANGED',
          message:
            'Checkout values changed. Confirm the updated quote before creating the order.',
          quote: result.changedQuote,
        },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      )
    return NextResponse.json(
      { order: result },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
