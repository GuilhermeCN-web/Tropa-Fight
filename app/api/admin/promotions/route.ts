import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizePromotions,
  hasOnlyPromotionKeys,
  invalidPromotionBodyResponse,
  promotionErrorResponse,
  promotionService,
  readPromotionObject,
} from '../../../../src/modules/promotions/presentation/http'

const promotionKeys = [
  'name',
  'applicationType',
  'discountType',
  'discountValue',
  'minimumCartSubtotalCents',
  'startsAt',
  'expiresAt',
  'status',
  'priority',
]

export async function GET(request: NextRequest) {
  const access = await authorizePromotions(request)
  if ('response' in access) return access.response
  try {
    return NextResponse.json(
      { promotions: await promotionService.list() },
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
  if (!body || !hasOnlyPromotionKeys(body, promotionKeys)) {
    return invalidPromotionBodyResponse()
  }
  try {
    const promotion = await promotionService.create(
      {
        name: body.name,
        applicationType: body.applicationType,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minimumCartSubtotalCents: body.minimumCartSubtotalCents,
        startsAt: body.startsAt,
        expiresAt: body.expiresAt,
        status: body.status,
        priority: body.priority,
      },
      access.principalId,
    )
    return NextResponse.json(
      { promotion },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return promotionErrorResponse(error)
  }
}
