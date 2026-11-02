import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizePromotions,
  couponService,
  hasOnlyPromotionKeys,
  invalidPromotionBodyResponse,
  promotionErrorResponse,
  readPromotionObject,
} from '../../../../../src/modules/promotions/presentation/http'

type RouteContext = { params: Promise<{ couponId: string }> }

const couponKeys = [
  'promotionId',
  'code',
  'status',
  'usageLimit',
  'usageLimitPerCustomer',
]

export async function PATCH(request: NextRequest, context: RouteContext) {
  const access = await authorizePromotions(request)
  if ('response' in access) return access.response
  const body = await readPromotionObject(request)
  if (!body || !hasOnlyPromotionKeys(body, couponKeys)) {
    return invalidPromotionBodyResponse()
  }
  const { couponId } = await context.params
  try {
    const coupon = await couponService.update(
      couponId,
      {
        promotionId: body.promotionId,
        code: body.code,
        status: body.status,
        usageLimit: body.usageLimit,
        usageLimitPerCustomer: body.usageLimitPerCustomer,
      },
      access.principalId,
    )
    return NextResponse.json(
      { coupon },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return promotionErrorResponse(error)
  }
}
