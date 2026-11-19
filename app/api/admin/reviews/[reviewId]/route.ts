import type { NextRequest } from 'next/server'
import { moderateReview } from '../../../../../src/modules/reviews/presentation/http'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await context.params
  return moderateReview(request, reviewId)
}
