import type { NextRequest } from 'next/server'
import { getModerationReviews } from '../../../../src/modules/reviews/presentation/http'

export function GET(request: NextRequest) {
  return getModerationReviews(request)
}
