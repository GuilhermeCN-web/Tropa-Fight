import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { sessionCookieName } from '../../src/modules/auth/application/session-service'

const configured = Boolean(process.env.DATABASE_URL)
const basePool = configured ? getDatabasePool() : undefined
const schema = `review_test_${randomUUID().replaceAll('-', '')}`
let testPool: Pool | undefined
let customerToken: string | undefined
let secondCustomerToken: string | undefined
let adminToken: string | undefined
let noPurchaseToken: string | undefined
let routes: {
  createReview: typeof import('../../app/api/products/[productId]/reviews/route').POST
  listPublicReviews: typeof import('../../app/api/products/[productId]/reviews/route').GET
  listCustomerReviews: typeof import('../../app/api/customer/reviews/route').GET
  updateReview: typeof import('../../app/api/reviews/[reviewId]/route').PATCH
  listFavorites: typeof import('../../app/api/customer/favorites/route').GET
  addFavorite: typeof import('../../app/api/customer/favorites/[productId]/route').POST
  removeFavorite: typeof import('../../app/api/customer/favorites/[productId]/route').DELETE
}

const ids = {
  customer: randomUUID(),
  secondCustomer: randomUUID(),
  admin: randomUUID(),
  noPurchase: randomUUID(),
  category: randomUUID(),
  brand: randomUUID(),
  product: randomUUID(),
  archivedProduct: randomUUID(),
  concurrentProduct: randomUUID(),
  variant: randomUUID(),
  archivedVariant: randomUUID(),
  concurrentVariant: randomUUID(),
}

function request(path: string, method = 'GET', token?: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(token ? { cookie: `${sessionCookieName}=${token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

const productContext = (productId: string) => ({
  params: Promise.resolve({ productId }),
})
const reviewContext = (reviewId: string) => ({
  params: Promise.resolve({ reviewId }),
})

describe.skipIf(!configured)(
  'product reviews and customer favorites API',
  () => {
    beforeAll(async () => {
      await basePool!.query(`CREATE SCHEMA ${schema}`)
      testPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        options: `-c search_path=${schema},public`,
        application_name: 'tropa-fight-task017-tests',
      })
      globalThis.identityPool = testPool
      const client = await testPool.connect()
      try {
        await client.query('BEGIN')
        for (const filename of [
          '001_identity.sql',
          '002_audit_logs.sql',
          '003_catalog.sql',
          '004_catalog_variants.sql',
          '005_inventory.sql',
          '006_cart.sql',
          '007_promotions_coupons.sql',
          '008_checkout_orders.sql',
          '009_order_item_discount_allocation.sql',
          '010_order_coupon_snapshot.sql',
          '011_mock_payments.sql',
          '012_reviews_favorites.sql',
        ]) {
          await client.query(
            await readFile(
              join(process.cwd(), 'db', 'migrations', filename),
              'utf8',
            ),
          )
        }
        await client.query(
          `INSERT INTO identity_users (id,email,password_hash,account_type)
         VALUES ($1,$5,'test-hash','CUSTOMER'),($2,$6,'test-hash','CUSTOMER'),
                ($3,$7,'test-hash','ADMIN'),($4,$8,'test-hash','CUSTOMER')`,
          [
            ids.customer,
            ids.secondCustomer,
            ids.admin,
            ids.noPurchase,
            `${ids.customer}@review.test`,
            `${ids.secondCustomer}@review.test`,
            `${ids.admin}@review.test`,
            `${ids.noPurchase}@review.test`,
          ],
        )
        await client.query(
          `INSERT INTO identity_user_roles (user_id,role_code)
         VALUES ($1,'CUSTOMER'),($2,'CUSTOMER'),($3,'GENERAL_ADMIN'),($4,'CUSTOMER')`,
          [ids.customer, ids.secondCustomer, ids.admin, ids.noPurchase],
        )
        await client.query(
          'INSERT INTO catalog_categories (id,name) VALUES ($1,$2)',
          [ids.category, `Review ${ids.category.slice(0, 8)}`],
        )
        await client.query(
          'INSERT INTO catalog_brands (id,name) VALUES ($1,$2)',
          [ids.brand, `Review ${ids.brand.slice(0, 8)}`],
        )
        for (const [productId, name, state] of [
          [ids.product, 'Review product', 'PUBLISHED'],
          [ids.archivedProduct, 'Archived favorite product', 'ARCHIVED'],
          [ids.concurrentProduct, 'Concurrent review product', 'PUBLISHED'],
        ]) {
          await client.query(
            `INSERT INTO catalog_products (id,name,brand_id,publication_state)
           VALUES ($1,$2,$3,$4)`,
            [productId, name, ids.brand, state],
          )
          await client.query(
            'INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)',
            [productId, ids.category],
          )
        }
        for (const [variantId, productId] of [
          [ids.variant, ids.product],
          [ids.archivedVariant, ids.archivedProduct],
          [ids.concurrentVariant, ids.concurrentProduct],
        ]) {
          await client.query(
            `INSERT INTO catalog_product_variants
            (id,product_id,sku,attributes,price_cents,status)
           VALUES ($1,$2,$3,'{}',10000,'ACTIVE')`,
            [variantId, productId, `RV-${variantId}`],
          )
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

      customerToken = await createSession(ids.customer)
      secondCustomerToken = await createSession(ids.secondCustomer)
      adminToken = await createSession(ids.admin)
      noPurchaseToken = await createSession(ids.noPurchase)
      await createOrder(ids.customer, ids.product, ids.variant, true)
      await createOrder(
        ids.secondCustomer,
        ids.concurrentProduct,
        ids.concurrentVariant,
        true,
      )
      await createOrder(ids.noPurchase, ids.product, ids.variant, false)
      routes = {
        createReview: (
          await import('../../app/api/products/[productId]/reviews/route')
        ).POST,
        listPublicReviews: (
          await import('../../app/api/products/[productId]/reviews/route')
        ).GET,
        listCustomerReviews: (
          await import('../../app/api/customer/reviews/route')
        ).GET,
        updateReview: (await import('../../app/api/reviews/[reviewId]/route'))
          .PATCH,
        listFavorites: (await import('../../app/api/customer/favorites/route'))
          .GET,
        addFavorite: (
          await import('../../app/api/customer/favorites/[productId]/route')
        ).POST,
        removeFavorite: (
          await import('../../app/api/customer/favorites/[productId]/route')
        ).DELETE,
      }
    })

    async function createOrder(
      customerId: string,
      productId: string,
      variantId: string,
      paid: boolean,
    ) {
      const orderId = randomUUID()
      const cartId = randomUUID()
      const client = await testPool!.connect()
      try {
        await client.query('BEGIN')
        await client.query(
          "INSERT INTO carts(id,customer_id,status) VALUES ($1,$2,'CONVERTED')",
          [cartId, customerId],
        )
        await client.query(
          `INSERT INTO orders
          (id,customer_id,cart_id,status,subtotal_cents,discount_cents,
           shipping_cents,total_cents,address_snapshot,payment_due_at)
         VALUES ($1,$2,$3,$4::order_status,10000,0,2000,12000,'{}',now())`,
          [
            orderId,
            customerId,
            cartId,
            paid ? 'PAYMENT_CONFIRMED' : 'PENDING_PAYMENT',
          ],
        )
        await client.query(
          `INSERT INTO order_items
          (id,order_id,product_id,variant_id,product_name_snapshot,
           attributes_snapshot,unit_price_cents,quantity,subtotal_cents,discount_cents)
         VALUES ($1,$2,$3,$4,'Purchased review product','{}',10000,1,10000,0)`,
          [randomUUID(), orderId, productId, variantId],
        )
        await client.query(
          `INSERT INTO payments
          (id,order_id,customer_id,provider,provider_payment_id,method,
           amount_cents,currency,status,idempotency_key,paid_at)
         VALUES ($1,$2,$3,'LOCAL_MOCK',$4,'PIX',12000,'BRL',$6,$5,$7)`,
          [
            randomUUID(),
            orderId,
            customerId,
            `RV-${randomUUID()}`,
            randomUUID(),
            paid ? 'APPROVED' : 'PENDING',
            paid ? new Date() : null,
          ],
        )
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    afterAll(async () => {
      await Promise.all(
        [customerToken, secondCustomerToken, adminToken, noPurchaseToken]
          .filter((token): token is string => Boolean(token))
          .map((token) => revokeSession(token)),
      )
      await testPool?.end()
      if (configured) {
        globalThis.identityPool = basePool
        await basePool!.query(`DROP SCHEMA ${schema} CASCADE`)
      }
    })

    it('requires an authenticated eligible customer and validates review input', async () => {
      const anonymousReviews = await routes.listCustomerReviews(
        request('/api/customer/reviews'),
      )
      expect(anonymousReviews!.status).toBe(401)

      const anonymous = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', undefined, {
          rating: 5,
        }),
        productContext(ids.product),
      )
      expect(anonymous!.status).toBe(401)

      const admin = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', adminToken, {
          rating: 5,
        }),
        productContext(ids.product),
      )
      expect(admin!.status).toBe(403)

      const invalidRating = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', customerToken, {
          rating: 6,
        }),
        productContext(ids.product),
      )
      expect(invalidRating!.status).toBe(400)

      const missingProductId = randomUUID()
      const missingProduct = await routes.createReview(
        request(
          `/api/products/${missingProductId}/reviews`,
          'POST',
          customerToken,
          { rating: 5 },
        ),
        productContext(missingProductId),
      )
      expect(missingProduct!.status).toBe(404)

      const impersonation = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', customerToken, {
          rating: 5,
          customerId: ids.secondCustomer,
        }),
        productContext(ids.product),
      )
      expect(impersonation!.status).toBe(400)

      const ineligible = await routes.createReview(
        request(
          `/api/products/${ids.product}/reviews`,
          'POST',
          noPurchaseToken,
          {
            rating: 5,
          },
        ),
        productContext(ids.product),
      )
      expect(ineligible!.status).toBe(403)
    })

    it('creates pending product reviews, enforces uniqueness, and resets moderation on edit', async () => {
      const created = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', customerToken, {
          rating: 5,
          comment: '  Ótimo produto  ',
        }),
        productContext(ids.product),
      )
      expect(created!.status).toBe(201)
      const review = (await created!.json()).review
      expect(review).toMatchObject({
        customerId: ids.customer,
        productId: ids.product,
        rating: 5,
        comment: 'Ótimo produto',
        status: 'PENDING',
        publishedAt: null,
      })

      const duplicate = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', customerToken, {
          rating: 4,
        }),
        productContext(ids.product),
      )
      expect(duplicate!.status).toBe(409)

      const hidden = await routes.listPublicReviews(
        request(`/api/products/${ids.product}/reviews`),
        productContext(ids.product),
      )
      expect((await hidden!.json()).reviews).toEqual([])

      const own = await routes.listCustomerReviews(
        request('/api/customer/reviews', 'GET', customerToken),
      )
      const ownBody = await own!.json()
      expect(ownBody.reviews).toHaveLength(1)
      expect(ownBody.reviews[0]).not.toHaveProperty('customerId')

      await testPool!.query(
        "UPDATE product_reviews SET status='PUBLISHED',published_at=now() WHERE id=$1",
        [review.id],
      )
      const visible = await routes.listPublicReviews(
        request(`/api/products/${ids.product}/reviews`),
        productContext(ids.product),
      )
      const publicBody = await visible!.json()
      expect(publicBody.reviews).toHaveLength(1)
      expect(publicBody.reviews[0]).not.toHaveProperty('customerId')

      const otherEdit = await routes.updateReview(
        request(`/api/reviews/${review.id}`, 'PATCH', secondCustomerToken, {
          comment: 'not mine',
        }),
        reviewContext(review.id),
      )
      expect(otherEdit!.status).toBe(404)

      const editPublished = await routes.updateReview(
        request(`/api/reviews/${review.id}`, 'PATCH', customerToken, {
          comment: 'Edited after publication',
        }),
        reviewContext(review.id),
      )
      expect((await editPublished!.json()).review).toMatchObject({
        status: 'PENDING',
        comment: 'Edited after publication',
        publishedAt: null,
      })

      await testPool!.query(
        "UPDATE product_reviews SET status='REJECTED' WHERE id=$1",
        [review.id],
      )
      const editRejected = await routes.updateReview(
        request(`/api/reviews/${review.id}`, 'PATCH', customerToken, {
          rating: 4,
        }),
        reviewContext(review.id),
      )
      expect((await editRejected!.json()).review).toMatchObject({
        rating: 4,
        status: 'PENDING',
      })

      const invalidComment = await routes.updateReview(
        request(`/api/reviews/${review.id}`, 'PATCH', customerToken, {
          comment: 'x'.repeat(2001),
        }),
        reviewContext(review.id),
      )
      expect(invalidComment!.status).toBe(400)
    })

    it('preserves favorite ownership and handles duplicate operations deterministically', async () => {
      const anonymousList = await routes.listFavorites(
        request('/api/customer/favorites'),
      )
      expect(anonymousList!.status).toBe(401)

      const anonymousAdd = await routes.addFavorite(
        request(`/api/customer/favorites/${ids.archivedProduct}`, 'POST'),
        productContext(ids.archivedProduct),
      )
      expect(anonymousAdd!.status).toBe(401)

      const spoofedFavorite = await routes.addFavorite(
        request(
          `/api/customer/favorites/${ids.archivedProduct}`,
          'POST',
          customerToken,
          { customerId: ids.secondCustomer },
        ),
        productContext(ids.archivedProduct),
      )
      expect(spoofedFavorite!.status).toBe(400)

      const first = await routes.addFavorite(
        request(
          `/api/customer/favorites/${ids.archivedProduct}`,
          'POST',
          customerToken,
        ),
        productContext(ids.archivedProduct),
      )
      const firstFavorite = (await first!.json()).favorite
      expect(firstFavorite).toMatchObject({
        customerId: ids.customer,
        productId: ids.archivedProduct,
        productPublicationState: 'ARCHIVED',
      })

      const duplicate = await routes.addFavorite(
        request(
          `/api/customer/favorites/${ids.archivedProduct}`,
          'POST',
          customerToken,
        ),
        productContext(ids.archivedProduct),
      )
      expect((await duplicate!.json()).favorite.id).toBe(firstFavorite.id)

      const otherCustomerRemoval = await routes.removeFavorite(
        request(
          `/api/customer/favorites/${ids.archivedProduct}`,
          'DELETE',
          secondCustomerToken,
        ),
        productContext(ids.archivedProduct),
      )
      expect(otherCustomerRemoval!.status).toBe(204)
      const stillOwned = await routes.listFavorites(
        request('/api/customer/favorites', 'GET', customerToken),
      )
      expect((await stillOwned!.json()).favorites).toHaveLength(1)

      const otherList = await routes.listFavorites(
        request('/api/customer/favorites', 'GET', secondCustomerToken),
      )
      expect((await otherList!.json()).favorites).toEqual([])

      const missingProductId = randomUUID()
      const missingProduct = await routes.addFavorite(
        request(
          `/api/customer/favorites/${missingProductId}`,
          'POST',
          customerToken,
        ),
        productContext(missingProductId),
      )
      expect(missingProduct!.status).toBe(404)

      await routes.removeFavorite(
        request(
          `/api/customer/favorites/${ids.archivedProduct}`,
          'DELETE',
          customerToken,
        ),
        productContext(ids.archivedProduct),
      )
      const simultaneousAdds = await Promise.all([
        routes.addFavorite(
          request(
            `/api/customer/favorites/${ids.archivedProduct}`,
            'POST',
            customerToken,
          ),
          productContext(ids.archivedProduct),
        ),
        routes.addFavorite(
          request(
            `/api/customer/favorites/${ids.archivedProduct}`,
            'POST',
            customerToken,
          ),
          productContext(ids.archivedProduct),
        ),
      ])
      const simultaneousFavorites = await Promise.all(
        simultaneousAdds.map(
          async (response) => (await response!.json()).favorite,
        ),
      )
      expect(simultaneousFavorites[0].id).toBe(simultaneousFavorites[1].id)
      const favoriteCount = await testPool!.query<{ total: string }>(
        'SELECT count(*)::text AS total FROM customer_favorites WHERE customer_id=$1 AND product_id=$2',
        [ids.customer, ids.archivedProduct],
      )
      expect(favoriteCount.rows[0]?.total).toBe('1')

      for (let index = 0; index < 2; index += 1) {
        const removed = await routes.removeFavorite(
          request(
            `/api/customer/favorites/${ids.archivedProduct}`,
            'DELETE',
            customerToken,
          ),
          productContext(ids.archivedProduct),
        )
        expect(removed!.status).toBe(204)
      }
    })

    it('enforces uniqueness under concurrent review submissions', async () => {
      const submit = () =>
        routes.createReview(
          request(
            `/api/products/${ids.concurrentProduct}/reviews`,
            'POST',
            secondCustomerToken,
            { rating: 4 },
          ),
          productContext(ids.concurrentProduct),
        )
      const responses = await Promise.all([submit(), submit()])
      expect(responses.map((response) => response!.status).sort()).toEqual([
        201, 409,
      ])
      const count = await testPool!.query<{ total: string }>(
        'SELECT count(*)::text AS total FROM product_reviews WHERE customer_id=$1 AND product_id=$2',
        [ids.secondCustomer, ids.concurrentProduct],
      )
      expect(count.rows[0]?.total).toBe('1')
    })

    it('hides public reviews and blocks new reviews after a product is archived', async () => {
      await testPool!.query(
        "UPDATE catalog_products SET publication_state='ARCHIVED' WHERE id=$1",
        [ids.product],
      )
      const publicResult = await routes.listPublicReviews(
        request(`/api/products/${ids.product}/reviews`),
        productContext(ids.product),
      )
      expect(publicResult!.status).toBe(404)

      const newReview = await routes.createReview(
        request(`/api/products/${ids.product}/reviews`, 'POST', customerToken, {
          rating: 3,
        }),
        productContext(ids.product),
      )
      expect(newReview!.status).toBe(409)

      const privateList = await routes.listCustomerReviews(
        request('/api/customer/reviews', 'GET', customerToken),
      )
      const privateBody = await privateList!.json()
      expect(privateBody.reviews[0]).toMatchObject({
        productId: ids.product,
        productPublicationState: 'ARCHIVED',
      })
      const ownReviewId = privateBody.reviews[0].id
      const editedWhileArchived = await routes.updateReview(
        request(`/api/reviews/${ownReviewId}`, 'PATCH', customerToken, {
          comment: 'Editado com produto arquivado',
        }),
        reviewContext(ownReviewId),
      )
      expect((await editedWhileArchived!.json()).review).toMatchObject({
        status: 'PENDING',
        comment: 'Editado com produto arquivado',
      })
    })
  },
)
