import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeCatalog,
  catalogErrorResponse,
  catalogService,
  hasOnlyKeys,
  invalidBodyResponse,
  readObject,
} from '../../../../src/modules/catalog/presentation/http'

const permission = 'catalog.products.manage'

export async function GET(request: NextRequest) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { products: await catalogService.listProducts() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return catalogErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const body = await readObject(request)
  if (
    !body ||
    !hasOnlyKeys(body, ['name', 'description', 'brandId', 'categoryIds']) ||
    typeof body.name !== 'string' ||
    typeof body.brandId !== 'string' ||
    !Array.isArray(body.categoryIds) ||
    !body.categoryIds.every((id) => typeof id === 'string') ||
    (body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== 'string')
  )
    return invalidBodyResponse()
  try {
    const product = await catalogService.createProduct(
      {
        name: body.name,
        description: body.description as string | null | undefined,
        brandId: body.brandId,
        categoryIds: body.categoryIds,
      },
      access.principalId,
    )
    return NextResponse.json(
      { product },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
