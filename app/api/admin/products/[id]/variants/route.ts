import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeCatalog,
  catalogErrorResponse,
  hasOnlyKeys,
  invalidBodyResponse,
  productVariantService,
} from '../../../../../../src/modules/catalog/presentation/http'

const permission = 'catalog.products.manage'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const { id: productId } = await context.params
  try {
    return NextResponse.json(
      { variants: await productVariantService.listByProduct(productId) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return catalogErrorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  const { id: productId } = await context.params
  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !hasOnlyKeys(body, ['sku', 'attributes', 'priceCents', 'status']) ||
    typeof body.sku !== 'string' ||
    typeof body.priceCents !== 'number' ||
    typeof body.status !== 'string' ||
    !body.attributes ||
    typeof body.attributes !== 'object' ||
    Array.isArray(body.attributes)
  ) {
    return invalidBodyResponse()
  }
  try {
    const variant = await productVariantService.create(
      productId,
      body,
      access.principalId,
    )
    return NextResponse.json(
      { variant },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
