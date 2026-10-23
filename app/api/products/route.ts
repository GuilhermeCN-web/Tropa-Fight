import { NextResponse } from 'next/server'
import {
  catalogErrorResponse,
  catalogService,
} from '../../../src/modules/catalog/presentation/http'
import { readCatalogSearchParams } from '../../../src/modules/catalog/presentation/catalog-search-params'

export async function GET(request: Request) {
  try {
    const query = readCatalogSearchParams(new URL(request.url).searchParams)
    const result = await catalogService.searchPublicProducts(query)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
