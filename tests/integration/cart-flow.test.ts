import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import {
  GET as getCartApi,
  POST as addCartItemApi,
} from '../../app/api/cart/route'
import {
  DELETE as deleteCartItemApi,
  PATCH as updateCartItemApi,
} from '../../app/api/cart/items/[itemId]/route'

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

describe.skipIf(!databaseConfigured)('cart PostgreSQL integration', () => {
  const customerId = randomUUID()
  const otherCustomerId = randomUUID()
  const adminId = randomUUID()
  const categoryId = randomUUID()
  const brandId = randomUUID()
  const productId = randomUUID()
  const variantId = randomUUID()
  let customerToken: string | undefined
  let otherCustomerToken: string | undefined
  let adminToken: string | undefined

  afterAll(async () => {
    if (customerToken) await revokeSession(customerToken)
    if (otherCustomerToken) await revokeSession(otherCustomerToken)
    if (adminToken) await revokeSession(adminToken)
    if (databaseConfigured) {
      await pool.query(
        'DELETE FROM carts WHERE customer_id = ANY($1::uuid[])',
        [[customerId, otherCustomerId]],
      )
      await pool.query('DELETE FROM inventory_stocks WHERE variant_id = $1', [
        variantId,
      ])
      await pool.query('DELETE FROM catalog_product_variants WHERE id = $1', [
        variantId,
      ])
      await pool.query('DELETE FROM catalog_products WHERE id = $1', [
        productId,
      ])
      await pool.query('DELETE FROM catalog_categories WHERE id = $1', [
        categoryId,
      ])
      await pool.query('DELETE FROM catalog_brands WHERE id = $1', [brandId])
      await pool.query(
        'DELETE FROM identity_users WHERE id = ANY($1::uuid[])',
        [[customerId, otherCustomerId, adminId]],
      )
      await pool.end()
    }
  })

  it('persists an authenticated customer cart, enforces stock and ownership, and uses the live price', async () => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO identity_users (id, email, password_hash, account_type)
         VALUES ($1, $2, 'test-hash', 'CUSTOMER'), ($3, $4, 'test-hash', 'CUSTOMER'),
                ($5, $6, 'test-hash', 'ADMIN')`,
        [
          customerId,
          `${customerId}@cart.test`,
          otherCustomerId,
          `${otherCustomerId}@cart.test`,
          adminId,
          `${adminId}@cart.test`,
        ],
      )
      await client.query(
        "INSERT INTO identity_user_roles (user_id, role_code) VALUES ($1, 'CUSTOMER'), ($2, 'CUSTOMER'), ($3, 'GENERAL_ADMIN')",
        [customerId, otherCustomerId, adminId],
      )
      await client.query(
        'INSERT INTO catalog_categories (id, name) VALUES ($1, $2)',
        [categoryId, `Cart ${categoryId.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id, name) VALUES ($1, $2)',
        [brandId, `Cart ${brandId.slice(0, 8)}`],
      )
      await client.query(
        "INSERT INTO catalog_products (id, name, brand_id, publication_state) VALUES ($1, 'Cart Test Product', $2, 'PUBLISHED')",
        [productId, brandId],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
        [productId, categoryId],
      )
      await client.query(
        "INSERT INTO catalog_product_variants (id, product_id, sku, attributes, price_cents, status) VALUES ($1, $2, 'CART-TEST', '{\"size\":\"M\"}', 7990, 'ACTIVE')",
        [variantId, productId],
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
    customerToken = await createSession(customerId)
    otherCustomerToken = await createSession(otherCustomerId)
    adminToken = await createSession(adminId)
    const customerCookie = `tropa_session=${customerToken}`
    const otherCookie = `tropa_session=${otherCustomerToken}`
    const adminCookie = `tropa_session=${adminToken}`

    expect((await getCartApi(request('/api/cart'))).status).toBe(401)
    expect(
      (await getCartApi(request('/api/cart', 'GET', undefined, adminCookie)))
        .status,
    ).toBe(403)
    const emptyResponse = await getCartApi(
      request('/api/cart', 'GET', undefined, customerCookie),
    )
    expect(emptyResponse.status).toBe(200)
    const emptyCart = (await emptyResponse.json()).cart
    expect(emptyCart).toMatchObject({
      items: [],
      totalItems: 0,
      subtotalCents: 0,
    })
    const repeatedGet = await getCartApi(
      request('/api/cart', 'GET', undefined, customerCookie),
    )
    expect((await repeatedGet.json()).cart.id).toBe(emptyCart.id)

    expect(
      (
        await addCartItemApi(
          request(
            '/api/cart',
            'POST',
            { variantId, quantity: 0 },
            customerCookie,
          ),
        )
      ).status,
    ).toBe(400)
    expect(
      (
        await addCartItemApi(
          request(
            '/api/cart',
            'POST',
            { variantId, quantity: 1, unitPriceCents: 1 },
            customerCookie,
          ),
        )
      ).status,
    ).toBe(400)
    await pool.query(
      "UPDATE catalog_product_variants SET status = 'INACTIVE' WHERE id = $1",
      [variantId],
    )
    expect(
      (
        await addCartItemApi(
          request(
            '/api/cart',
            'POST',
            { variantId, quantity: 1 },
            customerCookie,
          ),
        )
      ).status,
    ).toBe(409)
    await pool.query(
      "UPDATE catalog_product_variants SET status = 'ACTIVE' WHERE id = $1",
      [variantId],
    )

    const firstAdd = await addCartItemApi(
      request('/api/cart', 'POST', { variantId, quantity: 2 }, customerCookie),
    )
    const firstCart = (await firstAdd.json()).cart
    expect(firstAdd.status).toBe(201)
    expect(firstCart).toMatchObject({ totalItems: 2, subtotalCents: 15980 })
    const itemId = firstCart.items[0].id
    const secondAdd = await addCartItemApi(
      request('/api/cart', 'POST', { variantId, quantity: 1 }, customerCookie),
    )
    expect((await secondAdd.json()).cart).toMatchObject({
      totalItems: 3,
      subtotalCents: 23970,
    })

    expect(
      (
        await updateCartItemApi(
          request(
            `/api/cart/items/${itemId}`,
            'PATCH',
            { quantity: 4 },
            customerCookie,
          ),
          { params: Promise.resolve({ itemId }) },
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await updateCartItemApi(
          request(
            `/api/cart/items/${itemId}`,
            'PATCH',
            { quantity: 6 },
            customerCookie,
          ),
          { params: Promise.resolve({ itemId }) },
        )
      ).status,
    ).toBe(409)
    const insufficient = await addCartItemApi(
      request('/api/cart', 'POST', { variantId, quantity: 2 }, customerCookie),
    )
    expect(insufficient.status).toBe(409)
    const afterRejectedAdd = await getCartApi(
      request('/api/cart', 'GET', undefined, customerCookie),
    )
    expect((await afterRejectedAdd.json()).cart).toMatchObject({
      totalItems: 4,
      subtotalCents: 31960,
    })
    const crossCustomer = await updateCartItemApi(
      request(
        `/api/cart/items/${itemId}`,
        'PATCH',
        { quantity: 1 },
        otherCookie,
      ),
      { params: Promise.resolve({ itemId }) },
    )
    expect(crossCustomer.status).toBe(404)

    const concurrentAdds = await Promise.all([
      addCartItemApi(
        request(
          '/api/cart',
          'POST',
          { variantId, quantity: 1 },
          customerCookie,
        ),
      ),
      addCartItemApi(
        request(
          '/api/cart',
          'POST',
          { variantId, quantity: 1 },
          customerCookie,
        ),
      ),
    ])
    expect(concurrentAdds.map((response) => response.status).sort()).toEqual([
      201, 409,
    ])
    const afterConcurrentAdds = await getCartApi(
      request('/api/cart', 'GET', undefined, customerCookie),
    )
    expect((await afterConcurrentAdds.json()).cart).toMatchObject({
      totalItems: 5,
      subtotalCents: 39950,
    })

    await pool.query(
      'UPDATE catalog_product_variants SET price_cents = 9000 WHERE id = $1',
      [variantId],
    )
    const repricedResponse = await getCartApi(
      request('/api/cart', 'GET', undefined, customerCookie),
    )
    const repricedCart = (await repricedResponse.json()).cart
    expect(repricedCart.items[0]).toMatchObject({
      quantity: 5,
      unitPriceCents: 9000,
      subtotalCents: 45000,
    })

    await pool.query(
      'UPDATE inventory_stocks SET quantity = 0 WHERE variant_id = $1',
      [variantId],
    )
    const outOfStockCart = (
      await (
        await getCartApi(request('/api/cart', 'GET', undefined, customerCookie))
      ).json()
    ).cart
    expect(outOfStockCart.items[0]).toMatchObject({
      quantity: 5,
      availableQuantity: 0,
    })
    expect(
      (
        await deleteCartItemApi(
          request(
            `/api/cart/items/${itemId}`,
            'DELETE',
            undefined,
            customerCookie,
          ),
          { params: Promise.resolve({ itemId }) },
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await getCartApi(
          request('/api/cart', 'GET', undefined, customerCookie),
        ).then((response) => response.json())
      ).cart.items,
    ).toEqual([])
  })
})
