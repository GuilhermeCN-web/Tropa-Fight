import { NextResponse, type NextRequest } from 'next/server'
import { CatalogError } from '../../../../../src/modules/catalog/domain/catalog'
import {
  authorizeCatalog,
  catalogErrorResponse,
  hasOnlyKeys,
  invalidBodyResponse,
  notFoundResponse,
  productVariantService,
} from '../../../../../src/modules/catalog/presentation/http'

const permission = 'catalog.products.manage'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const { id } = await context.params
  try {
    const variant = await productVariantService.getById(id)
    return variant
      ? NextResponse.json(
          { variant },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      : notFoundResponse()
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
  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length === 0 ||
    !hasOnlyKeys(body, ['sku', 'attributes', 'priceCents', 'status']) ||
    (body.sku !== undefined && typeof body.sku !== 'string') ||
    (body.priceCents !== undefined && typeof body.priceCents !== 'number') ||
    (body.status !== undefined && typeof body.status !== 'string') ||
    (body.attributes !== undefined &&
      (!body.attributes ||
        typeof body.attributes !== 'object' ||
        Array.isArray(body.attributes)))
  ) {
    return invalidBodyResponse()
  }
  try {
    const variant = await productVariantService.update(
      id,
      body,
      access.principalId,
    )
    return NextResponse.json(
      { variant },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? NextResponse.json(
          { error: 'Invalid variant ID or input.' },
          { status: 400 },
        )
      : catalogErrorResponse(error)
  }
}
