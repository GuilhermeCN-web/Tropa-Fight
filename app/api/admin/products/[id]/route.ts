import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeCatalog,
  catalogErrorResponse,
  catalogService,
  hasOnlyKeys,
  invalidBodyResponse,
  readObject,
} from '../../../../../src/modules/catalog/presentation/http'
import { CatalogError } from '../../../../../src/modules/catalog/domain/catalog'

const permission = 'catalog.products.manage'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const { id } = await context.params
  try {
    const product = await catalogService.getProduct(id)
    return product
      ? NextResponse.json(
          { product },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      : NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })
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
    !hasOnlyKeys(body, ['name', 'description', 'brandId', 'categoryIds']) ||
    Object.keys(body).length === 0 ||
    (body.name !== undefined && typeof body.name !== 'string') ||
    (body.brandId !== undefined && typeof body.brandId !== 'string') ||
    (body.categoryIds !== undefined &&
      (!Array.isArray(body.categoryIds) ||
        !body.categoryIds.every((value) => typeof value === 'string'))) ||
    (body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== 'string')
  )
    return invalidBodyResponse()
  try {
    const product = await catalogService.updateProduct(
      id,
      body,
      access.principalId,
    )
    return NextResponse.json(
      { product },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? NextResponse.json(
          { error: 'Invalid product ID or input.' },
          { status: 400 },
        )
      : catalogErrorResponse(error)
  }
}
