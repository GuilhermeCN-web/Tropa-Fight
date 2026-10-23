import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeCatalog,
  catalogErrorResponse,
  catalogService,
  hasOnlyKeys,
  invalidBodyResponse,
  readObject,
} from '../../../../src/modules/catalog/presentation/http'

const permission = 'catalog.brands.manage'

export async function GET(request: NextRequest) {
  const access = await authorizeCatalog(request, permission)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { brands: await catalogService.listBrands() },
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
  if (!body || !hasOnlyKeys(body, ['name']) || typeof body.name !== 'string')
    return invalidBodyResponse()
  try {
    const brand = await catalogService.createBrand(
      body.name,
      access.principalId,
    )
    return NextResponse.json(
      { brand },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
