import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import { CouponService } from '../../coupons/application/coupon-service'
import { PostgresCouponRepository } from '../../coupons/infrastructure/postgres-coupon-repository'
import { PromotionError } from '../domain/promotion'
import { PromotionService } from '../application/promotion-service'
import { PostgresPromotionRepository } from '../infrastructure/postgres-promotion-repository'

export const promotionService = new PromotionService(
  new PostgresPromotionRepository(),
)
export const couponService = new CouponService(new PostgresCouponRepository())

export async function authorizePromotions(request: NextRequest) {
  const access = await requirePermission(request, 'promotions.manage')
  if (
    access.kind === 'authorized' &&
    access.principal.roles.includes('GENERAL_ADMIN')
  ) {
    return { principalId: access.principal.id } as const
  }
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
  } as const
}

export async function readPromotionObject(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export function hasOnlyPromotionKeys(
  body: Record<string, unknown>,
  allowed: string[],
): boolean {
  return Object.keys(body).every((key) => allowed.includes(key))
}

export function invalidPromotionBodyResponse() {
  return NextResponse.json(
    { error: 'Invalid request body.' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  )
}

export function promotionErrorResponse(error: unknown) {
  if (error instanceof PromotionError) {
    const status =
      error.code === 'VALIDATION'
        ? 400
        : error.code === 'NOT_FOUND' || error.code === 'COUPON_NOT_FOUND'
          ? 404
          : 409
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(
    { error: 'Unable to complete promotion operation.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}
