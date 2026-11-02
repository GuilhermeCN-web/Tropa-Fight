import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizePromotions,
  couponService,
  hasOnlyPromotionKeys,
  invalidPromotionBodyResponse,
  promotionErrorResponse,
  readPromotionObject,
} from '../../../../src/modules/promotions/presentation/http'

const couponKeys = [
  'promotionId',
  'code',
  'status',
  'usageLimit',
  'usageLimitPerCustomer',
]

export async function GET(request: NextRequest) {
  const access = await authorizePromotions(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { coupons: await couponService.list() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return promotionErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizePromotions(request)
  if ('response' in access) return access.response
  const body = await readPromotionObject(request)
  if (!body || !hasOnlyPromotionKeys(body, couponKeys)) {
    return invalidPromotionBodyResponse()
  }
  try {
    const coupon = await couponService.create(
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
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return promotionErrorResponse(error)
  }
}
