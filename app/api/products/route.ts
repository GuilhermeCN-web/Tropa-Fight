import { NextResponse } from 'next/server'
import {
  catalogErrorResponse,
  catalogService,
} from '../../../src/modules/catalog/presentation/http'

export async function GET() {
  try {
    return NextResponse.json(
      { products: await catalogService.listPublicProducts() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
