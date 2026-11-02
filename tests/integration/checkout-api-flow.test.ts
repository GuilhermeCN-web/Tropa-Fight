import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { sessionCookieName } from '../../src/modules/auth/application/session-service'
import { POST as createAddress } from '../../app/api/addresses/route'
import { PATCH as updateAddress } from '../../app/api/addresses/[addressId]/route'
import {
  GET as getCartApi,
  POST as addCartItem,
} from '../../app/api/cart/route'
import { POST as createQuote } from '../../app/api/checkout/quotes/route'
import { POST as createOrder } from '../../app/api/checkout/orders/route'

const configured = Boolean(process.env.DATABASE_URL)
const pool = configured ? getDatabasePool() : undefined
const ids = {
  customer: randomUUID(),
  category: randomUUID(),
  brand: randomUUID(),
  product: randomUUID(),
  variant: randomUUID(),
}
let token: string | undefined

function request(path: string, method: string, body: unknown, key?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      cookie: `${sessionCookieName}=${token}`,
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe.skipIf(!configured)('checkout authenticated API integration', () => {
  afterAll(async () => {
    if (token) await revokeSession(token)
    const fixtureCustomers = await pool!.query<{ id: string }>(
      "SELECT id FROM identity_users WHERE email LIKE '%@checkout-api.test'",
    )
    for (const { id: customerId } of fixtureCustomers.rows) {
      await pool!.query(
        'DELETE FROM checkout_idempotency_keys WHERE customer_id=$1',
        [customerId],
      )
      await pool!.query('DELETE FROM checkout_quotes WHERE customer_id=$1', [
        customerId,
      ])
      await pool!.query(
        'DELETE FROM inventory_reservations WHERE order_id IN (SELECT id FROM orders WHERE customer_id=$1)',
        [customerId],
      )
      await pool!.query(
        'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id=$1)',
        [customerId],
      )
      await pool!.query(
        'DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE customer_id=$1)',
        [customerId],
      )
      await pool!.query('DELETE FROM coupon_redemptions WHERE customer_id=$1', [
        customerId,
      ])
      await pool!.query(
        'UPDATE carts SET converted_to_order_id=NULL WHERE customer_id=$1',
        [customerId],
      )
      await pool!.query('DELETE FROM orders WHERE customer_id=$1', [customerId])
      await pool!.query('DELETE FROM customer_addresses WHERE customer_id=$1', [
        customerId,
      ])
      await pool!.query('DELETE FROM carts WHERE customer_id=$1', [customerId])
    }
    const fixtureProducts = await pool!.query<{ id: string; brand_id: string }>(
      "SELECT id,brand_id FROM catalog_products WHERE name='API checkout product'",
    )
    const fixtureProductIds = fixtureProducts.rows.map((product) => product.id)
    const fixtureVariantIds = fixtureProductIds.length
      ? await pool!.query<{ id: string }>(
          'SELECT id FROM catalog_product_variants WHERE product_id=ANY($1::uuid[])',
          [fixtureProductIds],
        )
      : { rows: [], rowCount: 0 }
    if (fixtureVariantIds.rowCount) {
      const variantIds = fixtureVariantIds.rows.map((variant) => variant.id)
      await pool!.query(
        'DELETE FROM inventory_stocks WHERE variant_id=ANY($1::uuid[])',
        [variantIds],
      )
      await pool!.query(
        'DELETE FROM catalog_product_variants WHERE id=ANY($1::uuid[])',
        [variantIds],
      )
    }
    if (fixtureProductIds.length) {
      await pool!.query(
        'DELETE FROM catalog_products WHERE id=ANY($1::uuid[])',
        [fixtureProductIds],
      )
      await pool!.query(
        "DELETE FROM catalog_categories WHERE name LIKE 'Checkout API %'",
      )
      const brandIds = fixtureProducts.rows.map((product) => product.brand_id)
      await pool!.query('DELETE FROM catalog_brands WHERE id=ANY($1::uuid[])', [
        brandIds,
      ])
    }
    if (fixtureCustomers.rowCount) {
      await pool!.query('DELETE FROM identity_users WHERE id=ANY($1::uuid[])', [
        fixtureCustomers.rows.map((customer) => customer.id),
      ])
    }
  })

  it('creates address, quote, and order over authenticated endpoints and replays idempotently', async () => {
    const client = await pool!.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        "INSERT INTO identity_users (id,email,password_hash,account_type) VALUES ($1,$2,'test-hash','CUSTOMER')",
        [ids.customer, `${ids.customer}@checkout-api.test`],
      )
      await client.query(
        "INSERT INTO identity_user_roles (user_id,role_code) VALUES ($1,'CUSTOMER')",
        [ids.customer],
      )
      await client.query(
        'INSERT INTO catalog_categories (id,name) VALUES ($1,$2)',
        [ids.category, `Checkout API ${ids.category.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id,name) VALUES ($1,$2)',
        [ids.brand, `Checkout API ${ids.brand.slice(0, 8)}`],
      )
      await client.query(
        "INSERT INTO catalog_products (id,name,brand_id,publication_state) VALUES ($1,'API checkout product',$2,'PUBLISHED')",
        [ids.product, ids.brand],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)',
        [ids.product, ids.category],
      )
      await client.query(
        "INSERT INTO catalog_product_variants (id,product_id,sku,attributes,price_cents,status) VALUES ($1,$2,$3,'{}'::jsonb,5000,'ACTIVE')",
        [ids.variant, ids.product, `CA-${ids.variant}`],
      )
      await client.query(
        'INSERT INTO inventory_stocks (variant_id,quantity) VALUES ($1,2)',
        [ids.variant],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    token = await createSession(ids.customer)

    const addressResponse = await createAddress(
      request('/api/addresses', 'POST', {
        recipientName: 'Ana Silva',
        cpf: '529.982.247-25',
        phone: '(11) 99999-1212',
        postalCode: '01310-100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'sp',
        country: 'br',
      }),
    )
    if (!addressResponse) throw new Error('Address route returned no response.')
    expect(addressResponse.status).toBe(201)
    const addressBody = (await addressResponse.json()) as {
      address: { id: string; cpf: string; phone: string }
    }
    expect(addressBody.address).toMatchObject({
      cpf: '52998224725',
      phone: '11999991212',
    })

    const cartResponse = await addCartItem(
      request('/api/cart', 'POST', { variantId: ids.variant, quantity: 1 }),
    )
    if (!cartResponse) throw new Error('Cart route returned no response.')
    expect(cartResponse.status).toBe(201)

    const quoteResponse = await createQuote(
      request('/api/checkout/quotes', 'POST', {
        addressId: addressBody.address.id,
      }),
    )
    if (!quoteResponse) throw new Error('Quote route returned no response.')
    expect(quoteResponse.status).toBe(201)
    const quoteBody = (await quoteResponse.json()) as {
      quote: {
        quoteId: string
        subtotalCents: number
        discountCents: number
        totalCents: number
        shipping: { shippingCents: number }
      }
    }
    expect(quoteBody.quote.subtotalCents).toBe(5000)
    expect(quoteBody.quote.shipping.shippingCents).toBe(2000)
    expect(quoteBody.quote.totalCents).toBe(
      quoteBody.quote.subtotalCents -
        quoteBody.quote.discountCents +
        quoteBody.quote.shipping.shippingCents,
    )

    const key = randomUUID()
    const orderResponse = await createOrder(
      request(
        '/api/checkout/orders',
        'POST',
        { quoteId: quoteBody.quote.quoteId },
        key,
      ),
    )
    if (!orderResponse) throw new Error('Order route returned no response.')
    expect(orderResponse.status).toBe(201)
    const orderBody = (await orderResponse.json()) as {
      order: { orderId: string; status: string }
    }
    expect(orderBody.order.status).toBe('PENDING_PAYMENT')
    const replayResponse = await createOrder(
      request(
        '/api/checkout/orders',
        'POST',
        { quoteId: quoteBody.quote.quoteId },
        key,
      ),
    )
    if (!replayResponse)
      throw new Error('Idempotent replay returned no response.')
    expect(replayResponse.status).toBe(201)
    expect((await replayResponse.json()).order.orderId).toBe(
      orderBody.order.orderId,
    )

    await pool!.query(
      "UPDATE catalog_products SET name='Changed after order' WHERE id=$1",
      [ids.product],
    )
    await pool!.query(
      'UPDATE catalog_product_variants SET price_cents=99999 WHERE id=$1',
      [ids.variant],
    )
    const itemSnapshot = await pool!.query<{
      product_name_snapshot: string
      unit_price_cents: string
    }>(
      'SELECT product_name_snapshot,unit_price_cents::text FROM order_items WHERE order_id=$1',
      [orderBody.order.orderId],
    )
    expect(itemSnapshot.rows[0]).toMatchObject({
      product_name_snapshot: 'API checkout product',
      unit_price_cents: '5000',
    })
    const orderAudit = await pool!.query<{ count: string }>(
      "SELECT count(*)::text count FROM audit_logs WHERE action='ORDER_CREATED' AND resource_id=$1",
      [orderBody.order.orderId],
    )
    expect(orderAudit.rows[0]?.count).toBe('1')

    const updatedAddress = await updateAddress(
      request(`/api/addresses/${addressBody.address.id}`, 'PATCH', {
        recipientName: 'Ana Silva',
        cpf: '52998224725',
        phone: '11999991212',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'Campinas',
        state: 'SP',
        country: 'BR',
      }),
      { params: Promise.resolve({ addressId: addressBody.address.id }) },
    )
    if (!updatedAddress)
      throw new Error('Address update route returned no response.')
    expect(updatedAddress.status).toBe(200)
    const savedOrder = await pool!.query<{
      cart_id: string
      address_snapshot: { city: string }
    }>('SELECT cart_id,address_snapshot FROM orders WHERE id=$1', [
      orderBody.order.orderId,
    ])
    expect(savedOrder.rows[0]?.address_snapshot.city).toBe('São Paulo')

    const nextCartResponse = await getCartApi(
      new NextRequest('http://localhost/api/cart', {
        headers: { cookie: `${sessionCookieName}=${token}` },
      }),
    )
    if (!nextCartResponse) throw new Error('Cart route returned no response.')
    expect(nextCartResponse.status).toBe(200)
    expect((await nextCartResponse.json()).cart.items).toHaveLength(0)
    const preservedItems = await pool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM cart_items WHERE cart_id=$1',
      [savedOrder.rows[0]!.cart_id],
    )
    expect(preservedItems.rows[0]?.count).toBe('1')
  })
})
