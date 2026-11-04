export const reviewStatuses = ['PENDING', 'PUBLISHED', 'REJECTED'] as const

export type ReviewStatus = (typeof reviewStatuses)[number]

export type Review = {
  id: string
  productId: string
  customerId: string
  rating: number
  comment: string | null
  status: ReviewStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export type ReviewInput = { rating: number; comment: string | null }
export type ReviewPatch = Partial<ReviewInput>
export type ReviewPage = { page: number; pageSize: number }
export type PublicReview = Pick<Review, 'rating' | 'comment' | 'createdAt'>
export type CustomerReview = Omit<Review, 'customerId'> & {
  productName: string
  productPublicationState: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}
export type ReviewPageResult<T> = {
  reviews: T[]
  page: number
  pageSize: number
  total: number
}

export class ReviewError extends Error {
  readonly code:
    | 'VALIDATION'
    | 'NOT_FOUND'
    | 'NOT_ELIGIBLE'
    | 'PRODUCT_INACTIVE'
    | 'CONFLICT'

  constructor(message: string, code: ReviewError['code']) {
    super(message)
    this.code = code
    this.name = 'ReviewError'
  }
}

export function normalizeReviewInput(value: unknown): ReviewInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ReviewError('Review must be an object.', 'VALIDATION')
  const input = value as Record<string, unknown>
  const rating = input.rating
  if (
    !Number.isInteger(rating) ||
    typeof rating !== 'number' ||
    rating < 1 ||
    rating > 5
  )
    throw new ReviewError(
      'Rating must be an integer from 1 to 5.',
      'VALIDATION',
    )
  const comment = normalizeComment(input.comment)
  return { rating, comment }
}

export function normalizeReviewPatch(value: unknown): ReviewPatch {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ReviewError('Review update must be an object.', 'VALIDATION')
  const input = value as Record<string, unknown>
  const keys = Object.keys(input)
  if (
    keys.length === 0 ||
    keys.some((key) => key !== 'rating' && key !== 'comment')
  )
    throw new ReviewError(
      'Review update must include rating or comment.',
      'VALIDATION',
    )
  const patch: ReviewPatch = {}
  if ('rating' in input) {
    if (
      typeof input.rating !== 'number' ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    )
      throw new ReviewError(
        'Rating must be an integer from 1 to 5.',
        'VALIDATION',
      )
    patch.rating = input.rating
  }
  if ('comment' in input) patch.comment = normalizeComment(input.comment)
  return patch
}

function normalizeComment(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string')
    throw new ReviewError('Comment must be a string.', 'VALIDATION')
  const comment = value.trim()
  if ([...comment].length > 2000)
    throw new ReviewError(
      'Comment must not exceed 2000 characters.',
      'VALIDATION',
    )
  return comment || null
}

export function parseReviewPage(params: URLSearchParams): ReviewPage {
  for (const key of params.keys()) {
    if (key !== 'page' && key !== 'pageSize')
      throw new ReviewError('Unsupported review query parameter.', 'VALIDATION')
    if (params.getAll(key).length !== 1)
      throw new ReviewError('Duplicate review query parameter.', 'VALIDATION')
  }
  const parse = (key: string, fallback: number, max: number) => {
    const value = params.get(key)
    if (value === null) return fallback
    if (!/^\d+$/.test(value))
      throw new ReviewError('Invalid pagination parameters.', 'VALIDATION')
    const parsed = Number(value)
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max)
      throw new ReviewError('Invalid pagination parameters.', 'VALIDATION')
    return parsed
  }
  return {
    page: parse('page', 1, 1_000_000),
    pageSize: parse('pageSize', 20, 100),
  }
}

export function isReviewStatus(value: string): value is ReviewStatus {
  return (reviewStatuses as readonly string[]).includes(value)
}
