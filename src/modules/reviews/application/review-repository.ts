import type {
  CustomerReview,
  PublicReview,
  Review,
  ReviewInput,
  ReviewPage,
  ReviewPageResult,
  ReviewPatch,
} from '../domain/review'

export interface ReviewRepository {
  create(
    customerId: string,
    productId: string,
    input: ReviewInput,
  ): Promise<Review>
  update(
    customerId: string,
    reviewId: string,
    patch: ReviewPatch,
  ): Promise<Review | null>
  listPublished(
    productId: string,
    page: ReviewPage,
  ): Promise<ReviewPageResult<PublicReview> | null>
  listForCustomer(
    customerId: string,
    page: ReviewPage,
  ): Promise<ReviewPageResult<CustomerReview>>
}
