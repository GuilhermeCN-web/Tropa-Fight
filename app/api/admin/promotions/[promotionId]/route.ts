import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizePromotions,
  hasOnlyPromotionKeys,
  invalidPromotionBodyResponse,
  promotionErrorResponse,
  promotionService,
  readPromotionObject,
} from '../../../../../src/modules/promotions/presentation/http'

type RouteContext = { params: Promise<{ promotionId: string }> }

const promotionKeys = [
  'name',
  'discountType',
  'discountValue',
  'minimumCartSubtotalCents',
  'startsAt',
  'expiresAt',
  'status',
  'priority',
]

export async function PATCH(request: NextRequest, context: RouteContext) {
  const access = await authorizePromotions(request)
  if ('response' in access) return access.response
  const body = await readPromotionObject(request)
  if (
    !body ||
    !hasOnlyPromotionKeys(body, promotionKeys) ||
    (body.discountValue !== undefined && body.discountType === undefined)
  ) {
    return invalidPromotionBodyResponse()
  }
  const { promotionId } = await context.params
  try {
    const promotion = await promotionService.update(
      promotionId,
      {
        name: body.name,
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
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return promotionErrorResponse(error)
  }
}
