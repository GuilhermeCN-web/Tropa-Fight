import type { NextRequest } from 'next/server'
import { updateReview } from '../../../../src/modules/reviews/presentation/http'

type Context = { params: Promise<{ reviewId: string }> }

export async function PATCH(request: NextRequest, context: Context) {
  const { reviewId } = await context.params
  return updateReview(request, reviewId)
}
