import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import {
  GET as listPromotionApi,
  POST as createPromotionApi,
} from '../../app/api/admin/promotions/route'
import {
  GET as listCouponApi,
  POST as createCouponApi,
} from '../../app/api/admin/coupons/route'
import { PATCH as updatePromotionApi } from '../../app/api/admin/promotions/[promotionId]/route'
import { PATCH as updateCouponApi } from '../../app/api/admin/coupons/[couponId]/route'
import {
  POST as applyCouponApi,
  DELETE as removeCouponApi,
} from '../../app/api/cart/coupon/route'
import { POST as addCartItemApi } from '../../app/api/cart/route'
import { DELETE as removeCartItemApi } from '../../app/api/cart/items/[itemId]/route'

const databaseConfigured = Boolean(process.env.DATABASE_URL)
const pool = getDatabasePool()

function request(
  path: string,
  method = 'GET',
  body?: unknown,
  cookie?: string,
) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

describe.skipIf(!databaseConfigured)('coupon PostgreSQL integration', () => {
  const customerId = randomUUID()
  const otherCustomerId = randomUUID()
  const adminId = randomUUID()
  const catalogManagerId = randomUUID()
  const categoryId = randomUUID()
  const brandId = randomUUID()
  const productId = randomUUID()
  const variantId = randomUUID()
  let customerToken: string | undefined
  let adminToken: string | undefined
  let catalogManagerToken: string | undefined
  const promotionIds: string[] = []
  const couponIds: string[] = []

  afterAll(async () => {
    if (customerToken) await revokeSession(customerToken)
    if (adminToken) await revokeSession(adminToken)
    if (catalogManagerToken) await revokeSession(catalogManagerToken)
    if (databaseConfigured) {
      await pool.query('DELETE FROM carts WHERE customer_id = $1', [customerId])
      if (couponIds.length) {
        await pool.query(
          'DELETE FROM coupon_redemptions WHERE coupon_id = ANY($1::uuid[])',
          [couponIds],
        )
        await pool.query('DELETE FROM coupons WHERE id = ANY($1::uuid[])', [
          couponIds,
        ])
      }
      if (promotionIds.length) {
        await pool.query('DELETE FROM promotions WHERE id = ANY($1::uuid[])', [
          promotionIds,
        ])
      }
      await pool.query('DELETE FROM inventory_stocks WHERE variant_id = $1', [
        variantId,
      ])
      await pool.query('DELETE FROM catalog_product_variants WHERE id = $1', [
        variantId,
      ])
      await pool.query('DELETE FROM catalog_products WHERE id = $1', [
        productId,
      ])
      await pool.query(
        'DELETE FROM catalog_product_categories WHERE product_id = $1',
        [productId],
      )
      await pool.query('DELETE FROM catalog_categories WHERE id = $1', [
        categoryId,
      ])
      await pool.query('DELETE FROM catalog_brands WHERE id = $1', [brandId])
      await pool.query(
        'DELETE FROM identity_users WHERE id = ANY($1::uuid[])',
        [[customerId, otherCustomerId, adminId, catalogManagerId]],
      )
      await pool.end()
    }
  })

  it('authorizes administration, applies one deterministic discount, and removes an ineligible coupon after cart edits', async () => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO identity_users (id, email, password_hash, account_type)
         VALUES ($1, $2, 'test-hash', 'CUSTOMER'),
                ($3, $4, 'test-hash', 'CUSTOMER'),
                ($5, $6, 'test-hash', 'ADMIN'),
                ($7, $8, 'test-hash', 'ADMIN')`,
        [
          customerId,
          `${customerId}@coupon.test`,
          otherCustomerId,
          `${otherCustomerId}@coupon.test`,
          adminId,
          `${adminId}@coupon.test`,
          catalogManagerId,
          `${catalogManagerId}@coupon.test`,
        ],
      )
      await client.query(
        `INSERT INTO identity_user_roles (user_id, role_code)
         VALUES ($1, 'CUSTOMER'), ($2, 'CUSTOMER'),
                ($3, 'GENERAL_ADMIN'), ($4, 'CATALOG_MANAGER')`,
        [customerId, otherCustomerId, adminId, catalogManagerId],
      )
      await client.query(
        'INSERT INTO catalog_categories (id, name) VALUES ($1, $2)',
        [categoryId, `Coupon ${categoryId.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id, name) VALUES ($1, $2)',
        [brandId, `Coupon ${brandId.slice(0, 8)}`],
      )
      await client.query(
        `INSERT INTO catalog_products
           (id, name, brand_id, publication_state)
         VALUES ($1, 'Coupon Test Product', $2, 'PUBLISHED')`,
        [productId, brandId],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
        [productId, categoryId],
      )
      await client.query(
        `INSERT INTO catalog_product_variants
           (id, product_id, sku, attributes, price_cents, status)
         VALUES ($1, $2, $3, '{"size":"M"}', 10000, 'ACTIVE')`,
        [variantId, productId, `COUPON-${variantId.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO inventory_stocks (variant_id, quantity) VALUES ($1, 5)',
        [variantId],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    const customerSession = await createSession(customerId)
    const adminSession = await createSession(adminId)
    const catalogManagerSession = await createSession(catalogManagerId)
    customerToken = customerSession
    adminToken = adminSession
    catalogManagerToken = catalogManagerSession
    const customerCookie = `tropa_session=${customerSession}`
    const adminCookie = `tropa_session=${adminSession}`
    const catalogManagerCookie = `tropa_session=${catalogManagerSession}`

    const customerDeniedResponse = await createPromotionApi(
      request('/api/admin/promotions', 'POST', {}, customerCookie),
    )
    if (!customerDeniedResponse) {
      throw new Error('Promotion API returned no response.')
    }
    expect(customerDeniedResponse.status).toBe(403)
    const managerDeniedResponse = await createPromotionApi(
      request('/api/admin/promotions', 'POST', {}, catalogManagerCookie),
    )
    if (!managerDeniedResponse) {
      throw new Error('Promotion API returned no response.')
    }
    expect(managerDeniedResponse.status).toBe(403)

    const now = Date.now()
    const activeWindow = {
      startsAt: new Date(now - 60_000).toISOString(),
      expiresAt: new Date(now + 3_600_000).toISOString(),
      status: 'ACTIVE',
    }
    const automaticResponse = await createPromotionApi(
      request(
        '/api/admin/promotions',
        'POST',
        {
          name: 'Automatic ten percent',
          applicationType: 'AUTOMATIC',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minimumCartSubtotalCents: 0,
          priority: 1,
          ...activeWindow,
        },
        adminCookie,
      ),
    )
    if (!automaticResponse)
      throw new Error('Promotion API returned no response.')
    expect(automaticResponse.status).toBe(201)
    const automaticPromotion = (await automaticResponse.json()).promotion
    promotionIds.push(automaticPromotion.id)
    const updatedPromotionResponse = await updatePromotionApi(
      request(
        `/api/admin/promotions/${automaticPromotion.id}`,
        'PATCH',
        { priority: 2 },
        adminCookie,
      ),
      { params: Promise.resolve({ promotionId: automaticPromotion.id }) },
    )
    if (!updatedPromotionResponse) {
      throw new Error('Promotion API returned no response.')
    }
    expect(updatedPromotionResponse.status).toBe(200)
    expect((await updatedPromotionResponse.json()).promotion.priority).toBe(2)

    const couponPromotionResponse = await createPromotionApi(
      request(
        '/api/admin/promotions',
        'POST',
        {
          name: 'Coupon ten percent',
          applicationType: 'COUPON',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minimumCartSubtotalCents: 10_000,
          priority: 0,
          ...activeWindow,
        },
        adminCookie,
      ),
    )
    if (!couponPromotionResponse) {
      throw new Error('Promotion API returned no response.')
    }
    expect(couponPromotionResponse.status).toBe(201)
    const couponPromotion = (await couponPromotionResponse.json()).promotion
    promotionIds.push(couponPromotion.id)

    const couponResponse = await createCouponApi(
      request(
        '/api/admin/coupons',
        'POST',
        {
          promotionId: couponPromotion.id,
          code: '  tropa10 ',
          status: 'ACTIVE',
          usageLimit: 5,
          usageLimitPerCustomer: 1,
        },
        adminCookie,
      ),
    )
    if (!couponResponse) throw new Error('Coupon API returned no response.')
    expect(couponResponse.status).toBe(201)
    const coupon = (await couponResponse.json()).coupon
    couponIds.push(coupon.id)
    expect(coupon.code).toBe('TROPA10')
    const updatedCouponResponse = await updateCouponApi(
      request(
        `/api/admin/coupons/${coupon.id}`,
        'PATCH',
        { usageLimit: 6 },
        adminCookie,
      ),
      { params: Promise.resolve({ couponId: coupon.id }) },
    )
    if (!updatedCouponResponse) {
      throw new Error('Coupon API returned no response.')
    }
    expect(updatedCouponResponse.status).toBe(200)
    expect((await updatedCouponResponse.json()).coupon.usageLimit).toBe(6)
    const couponListResponse = await listCouponApi(
      request('/api/admin/coupons', 'GET', undefined, adminCookie),
    )
    if (!couponListResponse) throw new Error('Coupon API returned no response.')
    expect(couponListResponse.status).toBe(200)
    expect(
      (await couponListResponse.json()).coupons.some(
        (listed: { id: string }) => listed.id === coupon.id,
      ),
    ).toBe(true)
    const promotionListResponse = await listPromotionApi(
      request('/api/admin/promotions', 'GET', undefined, adminCookie),
    )
    if (!promotionListResponse) {
      throw new Error('Promotion API returned no response.')
    }
    expect(promotionListResponse.status).toBe(200)

    const createTestPromotion = async (input: Record<string, unknown>) => {
      const response = await createPromotionApi(
        request('/api/admin/promotions', 'POST', input, adminCookie),
      )
      if (!response) throw new Error('Promotion API returned no response.')
      expect(response.status).toBe(201)
      const result = (await response.json()) as {
        promotion: { id: string }
      }
      promotionIds.push(result.promotion.id)
      return result.promotion
    }
    const createTestCoupon = async (
      promotionId: string,
      code: string,
      options: Record<string, unknown> = {},
    ) => {
      const response = await createCouponApi(
        request(
          '/api/admin/coupons',
          'POST',
          { promotionId, code, status: 'ACTIVE', ...options },
          adminCookie,
        ),
      )
      if (!response) throw new Error('Coupon API returned no response.')
      expect(response.status).toBe(201)
      const result = (await response.json()) as {
        coupon: { id: string; code: string }
      }
      couponIds.push(result.coupon.id)
      return result.coupon
    }
    const applyCode = (code: string) =>
      applyCouponApi(
        request('/api/cart/coupon', 'POST', { code }, customerCookie),
      )

    const expiredPromotion = await createTestPromotion({
      name: 'Expired coupon promotion',
      applicationType: 'COUPON',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startsAt: new Date(now - 3_600_000).toISOString(),
      expiresAt: new Date(now - 1_000).toISOString(),
      status: 'ACTIVE',
    })
    const expiredCoupon = await createTestCoupon(
      expiredPromotion.id,
      'EXPIRED10',
    )
    const futurePromotion = await createTestPromotion({
      name: 'Future coupon promotion',
      applicationType: 'COUPON',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startsAt: new Date(now + 3_600_000).toISOString(),
      expiresAt: new Date(now + 7_200_000).toISOString(),
      status: 'ACTIVE',
    })
    const futureCoupon = await createTestCoupon(futurePromotion.id, 'FUTURE10')
    const minimumPromotion = await createTestPromotion({
      name: 'Minimum coupon promotion',
      applicationType: 'COUPON',
      discountType: 'FIXED_AMOUNT',
      discountValue: 500,
      minimumCartSubtotalCents: 15_000,
      ...activeWindow,
    })
    const minimumCoupon = await createTestCoupon(
      minimumPromotion.id,
      'MINIMUM10',
    )
    const inactiveCoupon = await createTestCoupon(
      couponPromotion.id,
      'INACTIVE10',
      { status: 'INACTIVE' },
    )
    const limitedCoupon = await createTestCoupon(couponPromotion.id, 'ONCE10', {
      usageLimitPerCustomer: 1,
    })
    const globallyLimitedCoupon = await createTestCoupon(
      couponPromotion.id,
      'LIMIT10',
      { usageLimit: 1 },
    )
    await pool.query(
      `INSERT INTO coupon_redemptions (id, coupon_id, customer_id, order_id)
       VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
      [
        randomUUID(),
        limitedCoupon.id,
        customerId,
        randomUUID(),
        randomUUID(),
        globallyLimitedCoupon.id,
        otherCustomerId,
        randomUUID(),
      ],
    )

    const duplicateCouponResponse = await createCouponApi(
      request(
        '/api/admin/coupons',
        'POST',
        {
          promotionId: couponPromotion.id,
          code: 'TROPA10',
          status: 'ACTIVE',
        },
        adminCookie,
      ),
    )
    if (!duplicateCouponResponse) {
      throw new Error('Coupon API returned no response.')
    }
    expect(duplicateCouponResponse.status).toBe(409)

    const addResponse = await addCartItemApi(
      request('/api/cart', 'POST', { variantId, quantity: 1 }, customerCookie),
    )
    expect(addResponse.status).toBe(201)
    const itemId = (await addResponse.json()).cart.items[0].id

    const unauthenticatedApply = await applyCouponApi(
      request('/api/cart/coupon', 'POST', { code: 'TROPA10' }),
    )
    if (!unauthenticatedApply) {
      throw new Error('Cart API returned no response.')
    }
    expect(unauthenticatedApply.status).toBe(401)
    const clientControlledDiscount = await applyCouponApi(
      request(
        '/api/cart/coupon',
        'POST',
        { code: 'TROPA10', discountAmount: 99_999, cartId: randomUUID() },
        customerCookie,
      ),
    )
    if (!clientControlledDiscount) {
      throw new Error('Cart API returned no response.')
    }
    expect(clientControlledDiscount.status).toBe(400)

    const rejectedCoupons: [string, string, number][] = [
      ['DOESNOTEXIST', 'COUPON_NOT_FOUND', 404],
      [expiredCoupon.code, 'COUPON_EXPIRED', 409],
      [futureCoupon.code, 'COUPON_NOT_STARTED', 409],
      [minimumCoupon.code, 'COUPON_MINIMUM_AMOUNT_NOT_MET', 409],
      [inactiveCoupon.code, 'COUPON_INACTIVE', 409],
      [limitedCoupon.code, 'COUPON_CUSTOMER_LIMIT_REACHED', 409],
      [globallyLimitedCoupon.code, 'COUPON_USAGE_LIMIT_REACHED', 409],
    ]
    for (const [code, expectedCode, expectedStatus] of rejectedCoupons) {
      const response = await applyCode(code)
      if (!response) throw new Error('Cart API returned no response.')
      expect(response.status).toBe(expectedStatus)
      expect((await response.json()).code).toBe(expectedCode)
    }

    const appliedResponse = await applyCode('tropa10')
    if (!appliedResponse) throw new Error('Cart API returned no response.')
    expect(appliedResponse.status).toBe(200)
    expect((await appliedResponse.json()).cart).toMatchObject({
      subtotalCents: 10_000,
      discount: {
        source: 'PROMOTION',
        id: automaticPromotion.id,
        amountCents: 1_000,
      },
      totalCents: 9_000,
      appliedCoupon: { id: coupon.id, code: 'TROPA10' },
    })

    const repeatedApply = await applyCouponApi(
      request('/api/cart/coupon', 'POST', { code: 'TROPA10' }, customerCookie),
    )
    expect((await repeatedApply.json()).cart.totalCents).toBe(9_000)

    const [racedApply, removeItem] = await Promise.all([
      applyCode('TROPA10'),
      removeCartItemApi(
        request(
          `/api/cart/items/${itemId}`,
          'DELETE',
          undefined,
          customerCookie,
        ),
        { params: Promise.resolve({ itemId }) },
      ),
    ])
    if (!racedApply || !removeItem) {
      throw new Error('Cart API returned no response.')
    }
    expect([200, 409]).toContain(racedApply.status)
    expect(removeItem.status).toBe(200)
    expect((await removeItem.json()).cart).toMatchObject({
      subtotalCents: 0,
      discount: null,
      totalCents: 0,
      appliedCoupon: null,
      couponRemoved: true,
    })

    const removeCoupon = await removeCouponApi(
      request('/api/cart/coupon', 'DELETE', undefined, customerCookie),
    )
    expect(removeCoupon.status).toBe(200)
    expect((await removeCoupon.json()).cart.totalCents).toBe(0)
  })
})
