import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { FavoriteError } from '../domain/favorite'
import { FavoriteService } from '../application/favorite-service'
import { PostgresFavoriteRepository } from '../infrastructure/postgres-favorite-repository'

const service = new FavoriteService(new PostgresFavoriteRepository())
const noStore = { 'Cache-Control': 'no-store' }

async function customer(request: NextRequest) {
  const access = await requirePermission(request, 'identity.profile.read:self')
  if (
    access.kind === 'authorized' &&
    access.principal.accountType === 'CUSTOMER'
  )
    return { customerId: access.principal.id } as const
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
        headers: noStore,
      },
    ),
  } as const
}

function favoriteError(error: unknown) {
  if (error instanceof FavoriteError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      {
        status: error.code === 'VALIDATION' ? 400 : 404,
        headers: noStore,
      },
    )
  return NextResponse.json(
    { error: 'Unable to complete favorite operation.' },
    { status: 500, headers: noStore },
  )
}

export async function getFavorites(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { favorites: await service.listForCustomer(access.customerId) },
      { headers: noStore },
    )
  } catch (error) {
    return favoriteError(error)
  }
}

export async function addFavorite(request: NextRequest, productId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  if (request.body !== null)
    return NextResponse.json(
      { error: 'Request body is not supported.' },
      { status: 400, headers: noStore },
    )
  try {
    return NextResponse.json(
      { favorite: await service.add(access.customerId, productId) },
      { headers: noStore },
    )
  } catch (error) {
    return favoriteError(error)
  }
}

export async function removeFavorite(request: NextRequest, productId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  if (request.body !== null)
    return NextResponse.json(
      { error: 'Request body is not supported.' },
      { status: 400, headers: noStore },
    )
  try {
    await service.remove(access.customerId, productId)
    return new NextResponse(null, { status: 204, headers: noStore })
  } catch (error) {
    return favoriteError(error)
  }
}
