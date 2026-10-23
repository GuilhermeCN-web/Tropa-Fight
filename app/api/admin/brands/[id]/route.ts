import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeCatalog,
  catalogErrorResponse,
  catalogService,
  hasOnlyKeys,
  invalidBodyResponse,
  invalidIdResponse,
  readObject,
} from '../../../../../src/modules/catalog/presentation/http'
import { CatalogError } from '../../../../../src/modules/catalog/domain/catalog'

const permission = 'catalog.brands.manage'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const { id } = await context.params
  try {
    const brand = await catalogService.getBrand(id)
    return brand
      ? NextResponse.json(
          { brand },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      : NextResponse.json({ error: 'Brand not found.' }, { status: 404 })
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? invalidIdResponse()
      : catalogErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const { id } = await context.params
  const body = await readObject(request)
  if (
    !body ||
    !hasOnlyKeys(body, ['name', 'status']) ||
    Object.keys(body).length === 0 ||
    (body.name !== undefined && typeof body.name !== 'string') ||
    (body.status !== undefined &&
      body.status !== 'ACTIVE' &&
      body.status !== 'INACTIVE')
  )
    return invalidBodyResponse()
  try {
    const brand = await catalogService.updateBrand(id, body, access.principalId)
    return NextResponse.json(
      { brand },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? invalidIdResponse()
      : catalogErrorResponse(error)
  }
}
