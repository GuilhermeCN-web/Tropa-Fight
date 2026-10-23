import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { CatalogError } from '../domain/catalog'
import { CatalogService } from '../application/catalog-service'
import { PostgresCatalogRepository } from '../infrastructure/postgres-catalog-repository'
import { ProductVariantService } from '../application/product-variant-service'
import { PostgresProductVariantRepository } from '../infrastructure/postgres-product-variant-repository'

export const catalogService = new CatalogService(
  new PostgresCatalogRepository(),
)
export const productVariantService = new ProductVariantService(
  new PostgresProductVariantRepository(),
)

export async function authorizeCatalog(
  request: NextRequest,
  permission: string,
): Promise<{ principalId: string } | { response: NextResponse }> {
  const access = await requirePermission(request, permission)
  if (access.kind === 'authorized') return { principalId: access.principal.id }
  return {
    response: NextResponse.json(
      {
        error:
          access.kind === 'unauthenticated'
            ? 'Authentication required.'
            : 'Permission denied.',
      },
      {
        status: access.kind === 'unauthenticated' ? 401 : 403,
        headers: { 'Cache-Control': 'no-store' },
      },
    ),
  }
}

export async function readObject(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}

export function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: string[],
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key))
}

export function catalogErrorResponse(error: unknown): NextResponse {
  if (error instanceof CatalogError) {
    const status =
      error.code === 'VALIDATION' || error.code === 'REFERENCE'
        ? 400
        : error.code === 'NOT_FOUND'
          ? 404
          : 409
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(
    { error: 'Unable to complete catalog operation.' },
    { status: 500 },
  )
}

export function invalidBodyResponse(): NextResponse {
  return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
}

export function invalidIdResponse(): NextResponse {
  return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })
}

export function notFoundResponse(): NextResponse {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 })
}
