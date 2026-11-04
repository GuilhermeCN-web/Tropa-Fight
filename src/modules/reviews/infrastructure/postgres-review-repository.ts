import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import type {
  CustomerReview,
  PublicReview,
  Review,
  ReviewInput,
  ReviewPage,
  ReviewPageResult,
  ReviewPatch,
  ReviewStatus,
} from '../domain/review'
import { ReviewError, isReviewStatus } from '../domain/review'
import type { ReviewRepository } from '../application/review-repository'

type ReviewRow = {
  id: string
  product_id: string
  customer_id: string
  rating: number
  comment: string | null
  status: string
  created_at: Date | string
  updated_at: Date | string
  published_at: Date | string | null
}

function iso(value: Date | string | null) {
  return value === null ? null : new Date(value).toISOString()
}

function mapReview(row: ReviewRow): Review {
  if (!isReviewStatus(row.status))
    throw new Error('Stored review status is invalid.')
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.customer_id,
    rating: row.rating,
    comment: row.comment,
    status: row.status as ReviewStatus,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
    publishedAt: iso(row.published_at),
  }
}

function rollback(client: PoolClient) {
  return client.query('ROLLBACK')
}

export class PostgresReviewRepository implements ReviewRepository {
  private readonly configuredPool?: Pool

  constructor(configuredPool?: Pool) {
    this.configuredPool = configuredPool
  }

  private get pool(): Pool {
    return this.configuredPool ?? getDatabasePool()
  }

  async create(
    customerId: string,
    productId: string,
    input: ReviewInput,
  ): Promise<Review> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const product = await client.query<{ publication_state: string }>(
        'SELECT publication_state FROM catalog_products WHERE id=$1 FOR SHARE',
        [productId],
      )
      if (!product.rows[0])
        throw new ReviewError('Product not found.', 'NOT_FOUND')
      if (product.rows[0].publication_state !== 'PUBLISHED')
        throw new ReviewError(
          'Product is not available for new reviews.',
          'PRODUCT_INACTIVE',
        )

      const eligible = await client.query<{ allowed: boolean }>(
        `SELECT EXISTS (
           SELECT 1
             FROM orders o
             JOIN payments p ON p.order_id=o.id
             JOIN order_items oi ON oi.order_id=o.id
            WHERE o.customer_id=$1 AND oi.product_id=$2
              AND o.status='PAYMENT_CONFIRMED' AND p.status='APPROVED'
         ) AS allowed`,
        [customerId, productId],
      )
      if (!eligible.rows[0]?.allowed)
        throw new ReviewError(
          'A confirmed paid order containing this product is required.',
          'NOT_ELIGIBLE',
        )

      const inserted = await client.query<ReviewRow>(
        `INSERT INTO product_reviews
           (id,product_id,customer_id,rating,comment,status)
         VALUES ($1,$2,$3,$4,$5,'PENDING')
         RETURNING id,product_id,customer_id,rating,comment,status,
                   created_at,updated_at,published_at`,
        [randomUUID(), productId, customerId, input.rating, input.comment],
      )
      await client.query('COMMIT')
      return mapReview(inserted.rows[0]!)
    } catch (error) {
      await rollback(client).catch(() => undefined)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      )
        throw new ReviewError(
          'A review for this product already exists.',
          'CONFLICT',
        )
      throw error
    } finally {
      client.release()
    }
  }

  async update(
    customerId: string,
    reviewId: string,
    patch: ReviewPatch,
  ): Promise<Review | null> {
    const result = await this.pool.query<ReviewRow>(
      `UPDATE product_reviews
          SET rating=CASE WHEN $3::boolean THEN $4::smallint ELSE rating END,
              comment=CASE WHEN $5::boolean THEN $6::varchar ELSE comment END,
              status=CASE WHEN status='PENDING' THEN status ELSE 'PENDING'::review_status END,
              published_at=NULL,
              updated_at=now()
        WHERE id=$1 AND customer_id=$2
        RETURNING id,product_id,customer_id,rating,comment,status,
                  created_at,updated_at,published_at`,
      [
        reviewId,
        customerId,
        'rating' in patch,
        patch.rating ?? null,
        'comment' in patch,
        patch.comment ?? null,
      ],
    )
    return result.rows[0] ? mapReview(result.rows[0]) : null
  }

  async listPublished(
    productId: string,
    page: ReviewPage,
  ): Promise<ReviewPageResult<PublicReview> | null> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const product = await client.query(
        `SELECT p.id
           FROM catalog_products p
           JOIN catalog_brands b ON b.id=p.brand_id
          WHERE p.id=$1 AND p.publication_state='PUBLISHED'
            AND b.status='ACTIVE'
            AND EXISTS (
              SELECT 1 FROM catalog_product_categories pc
               WHERE pc.product_id=p.id
            )
            AND NOT EXISTS (
              SELECT 1 FROM catalog_product_categories pc
              JOIN catalog_categories c ON c.id=pc.category_id
              WHERE pc.product_id=p.id AND c.status<>'ACTIVE'
            )`,
        [productId],
      )
      if (!product.rows[0]) {
        await client.query('ROLLBACK')
        return null
      }
      const count = await client.query<{ total: string }>(
        "SELECT count(*)::text AS total FROM product_reviews WHERE product_id=$1 AND status='PUBLISHED'",
        [productId],
      )
      const offset = (page.page - 1) * page.pageSize
      const rows = await client.query<ReviewRow>(
        `SELECT id,product_id,customer_id,rating,comment,status,
                created_at,updated_at,published_at
           FROM product_reviews
          WHERE product_id=$1 AND status='PUBLISHED'
          ORDER BY published_at DESC,id DESC LIMIT $2 OFFSET $3`,
        [productId, page.pageSize, offset],
      )
      await client.query('COMMIT')
      return {
        reviews: rows.rows.map((row) => {
          const review = mapReview(row)
          return {
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          }
        }),
        page: page.page,
        pageSize: page.pageSize,
        total: Number(count.rows[0]?.total ?? '0'),
      }
    } catch (error) {
      await rollback(client).catch(() => undefined)
      throw error
    } finally {
      client.release()
    }
  }

  async listForCustomer(
    customerId: string,
    page: ReviewPage,
  ): Promise<ReviewPageResult<CustomerReview>> {
    const count = await this.pool.query<{ total: string }>(
      'SELECT count(*)::text AS total FROM product_reviews WHERE customer_id=$1',
      [customerId],
    )
    const offset = (page.page - 1) * page.pageSize
    const rows = await this.pool.query<
      ReviewRow & {
        product_name: string
        product_publication_state: CustomerReview['productPublicationState']
      }
    >(
      `SELECT r.id,r.product_id,r.customer_id,r.rating,r.comment,r.status,
              r.created_at,r.updated_at,r.published_at,p.name AS product_name,
              p.publication_state AS product_publication_state
         FROM product_reviews r
         JOIN catalog_products p ON p.id=r.product_id
        WHERE r.customer_id=$1
        ORDER BY r.created_at DESC,r.id DESC LIMIT $2 OFFSET $3`,
      [customerId, page.pageSize, offset],
    )
    return {
      reviews: rows.rows.map((row) => {
        const review = mapReview(row)
        return {
          id: review.id,
          productId: review.productId,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          publishedAt: review.publishedAt,
          productName: row.product_name,
          productPublicationState: row.product_publication_state,
        }
      }),
      page: page.page,
      pageSize: page.pageSize,
      total: Number(count.rows[0]?.total ?? '0'),
    }
  }
}
