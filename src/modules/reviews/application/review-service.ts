import {
  normalizeReviewInput,
  normalizeReviewPatch,
  ReviewError,
  type ReviewPage,
} from '../domain/review'
import type { ReviewRepository } from './review-repository'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireUuid(value: string): string {
  if (!uuidPattern.test(value))
    throw new ReviewError('Invalid ID.', 'VALIDATION')
  return value
}

function requirePage(page: ReviewPage) {
  if (
    !Number.isSafeInteger(page.page) ||
    page.page < 1 ||
    page.page > 1_000_000 ||
    !Number.isSafeInteger(page.pageSize) ||
    page.pageSize < 1 ||
    page.pageSize > 100 ||
    !Number.isSafeInteger((page.page - 1) * page.pageSize)
  )
    throw new ReviewError('Invalid pagination parameters.', 'VALIDATION')
}

export class ReviewService {
  private readonly repository: ReviewRepository

  constructor(repository: ReviewRepository) {
    this.repository = repository
  }

  create(customerId: string, productId: string, input: unknown) {
    return this.repository.create(
      requireUuid(customerId),
      requireUuid(productId),
      normalizeReviewInput(input),
    )
  }

  update(customerId: string, reviewId: string, input: unknown) {
    return this.repository.update(
      requireUuid(customerId),
      requireUuid(reviewId),
      normalizeReviewPatch(input),
    )
  }

  listPublished(productId: string, page: ReviewPage) {
    requirePage(page)
    return this.repository.listPublished(requireUuid(productId), page)
  }

  listForCustomer(customerId: string, page: ReviewPage) {
    requirePage(page)
    return this.repository.listForCustomer(requireUuid(customerId), page)
  }
}
