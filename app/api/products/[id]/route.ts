import { NextResponse } from 'next/server'
import {
  catalogErrorResponse,
  catalogService,
  notFoundResponse,
} from '../../../../src/modules/catalog/presentation/http'
import { CatalogError } from '../../../../src/modules/catalog/domain/catalog'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  try {
    const product = await catalogService.getPublicProduct(id)
    return product
      ? NextResponse.json(
          { product },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      : notFoundResponse()
  } catch (error) {
    return error instanceof CatalogError && error.code === 'VALIDATION'
      ? NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })
      : catalogErrorResponse(error)
  }
}
