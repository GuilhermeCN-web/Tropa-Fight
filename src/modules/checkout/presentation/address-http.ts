import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { CheckoutError, normalizeAddress } from '../domain/checkout'
import { PostgresAddressRepository } from '../infrastructure/postgres-address-repository'

const repository = new PostgresAddressRepository()

async function customer(request: NextRequest) {
  const access = await requirePermission(request, 'identity.profile.read:self')
  if (
    access.kind === 'authorized' &&
    access.principal.accountType === 'CUSTOMER'
  ) {
    return { id: access.principal.id }
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

function error(error: unknown) {
  if (error instanceof CheckoutError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      {
        status:
          error.code === 'VALIDATION'
            ? 400
            : error.code === 'NOT_FOUND'
              ? 404
              : 409,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  return NextResponse.json(
    { error: 'Unable to complete address operation.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}

async function body(request: NextRequest) {
  try {
    return (await request.json()) as unknown
  } catch {
    return null
  }
}

export async function listAddresses(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { addresses: await repository.list(access.id) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (reason) {
    return error(reason)
  }
}

export async function createAddress(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      {
        address: await repository.create(
          access.id,
          normalizeAddress(await body(request)),
        ),
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (reason) {
    return error(reason)
  }
}

export async function getAddress(request: NextRequest, addressId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  try {
    const address = await repository.get(access.id, addressId)
    return address
      ? NextResponse.json(
          { address },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      : NextResponse.json(
          { error: 'Address not found.' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } },
        )
  } catch (reason) {
    return error(reason)
  }
}

export async function updateAddress(request: NextRequest, addressId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  try {
    const address = await repository.update(
      access.id,
      addressId,
      normalizeAddress(await body(request)),
    )
    return address
      ? NextResponse.json(
          { address },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      : NextResponse.json(
          { error: 'Address not found.' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } },
        )
  } catch (reason) {
    return error(reason)
  }
}
