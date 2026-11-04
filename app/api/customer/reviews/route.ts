import type { NextRequest } from 'next/server'
import { getCustomerReviews } from '../../../../src/modules/reviews/presentation/http'

export function GET(request: NextRequest) {
  return getCustomerReviews(request)
}
