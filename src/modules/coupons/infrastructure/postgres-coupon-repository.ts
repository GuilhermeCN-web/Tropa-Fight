import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import { PromotionError } from '../../promotions/domain/promotion'
import type {
  CouponWithUsage,
  CouponRepository,
  CreateCouponInput,
  UpdateCouponInput,
} from '../application/coupon-repository'
import type { Coupon } from '../domain/coupon'

type CouponRow = {
  id: string
  promotion_id: string
  code: string
  status: Coupon['status']
  usage_limit: string | null
  usage_limit_per_customer: string | null
  redeemed_count: string
  created_at: Date
  updated_at: Date
}

function safeCount(value: string, label: string): number {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Stored ${label} exceeds the supported safe integer.`)
  }
  return number
}

function nullableLimit(value: string | null, label: string): number | null {
  return value === null ? null : safeCount(value, label)
}

function toCoupon(row: CouponRow): CouponWithUsage {
  return {
    id: row.id,
    promotionId: row.promotion_id,
    code: row.code,
    status: row.status,
    usageLimit: nullableLimit(row.usage_limit, 'coupon usage limit'),
    usageLimitPerCustomer: nullableLimit(
      row.usage_limit_per_customer,
      'per-customer coupon usage limit',
    ),
    redeemedCount: safeCount(row.redeemed_count, 'coupon redemption count'),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function inTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function requireCouponPromotion(
  client: PoolClient,
  promotionId: string,
): Promise<void> {
  const result = await client.query<{ application_type: string }>(
    'SELECT application_type FROM promotions WHERE id = $1 FOR SHARE',
    [promotionId],
  )
  const promotion = result.rows[0]
  if (!promotion) {
    throw new PromotionError('Promotion not found.', 'NOT_FOUND')
  }
  if (promotion.application_type !== 'COUPON') {
    throw new PromotionError(
      'Coupons must reference a coupon promotion.',
      'VALIDATION',
    )
  }
}

function translateDatabaseError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    throw new PromotionError(
      'A coupon with this normalized code already exists.',
      'CONFLICT',
    )
  }
  throw error
}

export class PostgresCouponRepository implements CouponRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async list(): Promise<CouponWithUsage[]> {
    const result = await this.pool.query<CouponRow>(
      `SELECT c.id, c.promotion_id, c.code, c.status,
              c.usage_limit::text AS usage_limit,
              c.usage_limit_per_customer::text AS usage_limit_per_customer,
              count(r.id)::text AS redeemed_count, c.created_at, c.updated_at
         FROM coupons c
         LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC, c.id`,
    )
    return result.rows.map(toCoupon)
  }

  async create(input: CreateCouponInput, actorId: string): Promise<Coupon> {
    try {
      return await inTransaction(this.pool, async (client) => {
        await requireCouponPromotion(client, input.promotionId)
        const id = randomUUID()
        const result = await client.query<CouponRow>(
          `INSERT INTO coupons
             (id, promotion_id, code, status, usage_limit,
              usage_limit_per_customer, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, promotion_id, code, status,
                     usage_limit::text AS usage_limit,
                     usage_limit_per_customer::text AS usage_limit_per_customer,
                     '0' AS redeemed_count, created_at, updated_at`,
          [
            id,
            input.promotionId,
            input.code,
            input.status,
            input.usageLimit,
            input.usageLimitPerCustomer,
            actorId,
          ],
        )
        await insertAuditEvent(
          client,
          createAuditEvent({
            actorId,
            action: 'COUPON_CREATED',
            resourceType: 'Coupon',
            resourceId: id,
            result: 'SUCCESS',
            source: 'promotions.admin',
          }),
        )
        return toCoupon(result.rows[0])
      })
    } catch (error) {
      translateDatabaseError(error)
    }
  }

  async update(
    id: string,
    input: UpdateCouponInput,
    actorId: string,
  ): Promise<Coupon> {
    try {
      return await inTransaction(this.pool, async (client) => {
        const currentResult = await client.query<CouponRow>(
          `SELECT c.id, c.promotion_id, c.code, c.status,
                  c.usage_limit::text AS usage_limit,
                  c.usage_limit_per_customer::text AS usage_limit_per_customer,
                  (SELECT count(*)::text FROM coupon_redemptions r
                    WHERE r.coupon_id = c.id) AS redeemed_count,
                  c.created_at, c.updated_at
             FROM coupons c
            WHERE c.id = $1
            FOR UPDATE OF c`,
          [id],
        )
        const current = currentResult.rows[0]
        if (!current) throw new PromotionError('Coupon not found.', 'NOT_FOUND')
        const existing = toCoupon(current)
        const promotionId = input.promotionId ?? existing.promotionId
        if (input.promotionId !== undefined) {
          await requireCouponPromotion(client, promotionId)
        }
        const result = await client.query<CouponRow>(
          `UPDATE coupons
              SET promotion_id = $2, code = $3, status = $4, usage_limit = $5,
                  usage_limit_per_customer = $6, updated_at = now()
            WHERE id = $1
            RETURNING id, promotion_id, code, status,
                      usage_limit::text AS usage_limit,
                      usage_limit_per_customer::text AS usage_limit_per_customer,
                      (SELECT count(*)::text FROM coupon_redemptions
                        WHERE coupon_id = coupons.id) AS redeemed_count,
                      created_at, updated_at`,
          [
            id,
            promotionId,
            input.code ?? existing.code,
            input.status ?? existing.status,
            input.usageLimit === undefined
              ? existing.usageLimit
              : input.usageLimit,
            input.usageLimitPerCustomer === undefined
              ? existing.usageLimitPerCustomer
              : input.usageLimitPerCustomer,
          ],
        )
        await insertAuditEvent(
          client,
          createAuditEvent({
            actorId,
            action: 'COUPON_UPDATED',
            resourceType: 'Coupon',
            resourceId: id,
            result: 'SUCCESS',
            source: 'promotions.admin',
          }),
        )
        return toCoupon(result.rows[0])
      })
    } catch (error) {
      translateDatabaseError(error)
    }
  }
}
