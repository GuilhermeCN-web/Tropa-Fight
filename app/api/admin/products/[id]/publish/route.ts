import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeCatalog,
  catalogErrorResponse,
  catalogService,
} from '../../../../../../src/modules/catalog/presentation/http'
import { CatalogError } from '../../../../../../src/modules/catalog/domain/catalog'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeCatalog(request, 'catalog.products.publish')
  if ('response' in access) return access.response
  const { id } = await context.params
  try {
    const product = await catalogService.publishProduct(id, access.principalId)
    return NextResponse.json(
      { product },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })
      : catalogErrorResponse(error)
  }
}
