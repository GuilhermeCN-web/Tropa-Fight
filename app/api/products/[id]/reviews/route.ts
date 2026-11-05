import type { NextRequest } from 'next/server'
import {
  createReview,
  getPublicReviews,
} from '../../../../../src/modules/reviews/presentation/http'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const { id: productId } = await context.params
  return getPublicReviews(request, productId)
}

export async function POST(request: NextRequest, context: Context) {
  const { id: productId } = await context.params
  return createReview(request, productId)
}
