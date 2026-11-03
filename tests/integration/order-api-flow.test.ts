import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { sessionCookieName } from '../../src/modules/auth/application/session-service'
import { GET as listOrders } from '../../app/api/orders/route'
import { GET as getOrder } from '../../app/api/orders/[orderId]/route'
import { GET as getTracking } from '../../app/api/orders/[orderId]/tracking/route'
import { GET as listAdminOrders } from '../../app/api/admin/orders/route'
import { GET as getAdminOrder } from '../../app/api/admin/orders/[orderId]/route'

const configured = Boolean(process.env.DATABASE_URL)
const pool = configured ? getDatabasePool() : undefined
const ids = {
  customer: randomUUID(),
  secondCustomer: randomUUID(),
  emptyCustomer: randomUUID(),
  admin: randomUUID(),
  catalogAdmin: randomUUID(),
  category: randomUUID(),
  brand: randomUUID(),
  product: randomUUID(),
  variant: randomUUID(),
  carts: [randomUUID(), randomUUID(), randomUUID(), randomUUID()],
  orders: [randomUUID(), randomUUID(), randomUUID(), randomUUID()],
  items: [randomUUID(), randomUUID(), randomUUID(), randomUUID()],
  shipments: [randomUUID(), randomUUID(), randomUUID(), randomUUID()],
  payments: [randomUUID(), randomUUID()],
  idempotency: [randomUUID(), randomUUID()],
}
let customerToken: string | undefined
let secondCustomerToken: string | undefined
let adminToken: string | undefined
let catalogAdminToken: string | undefined
let emptyCustomerToken: string | undefined

function request(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { cookie: `${sessionCookieName}=${token}` } : undefined,
  })
}

const routeContext = (orderId: string) => ({
  params: Promise.resolve({ orderId }),
})

describe.skipIf(!configured)('order read API integration', () => {
  beforeAll(async () => {
    const client = await pool!.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type)
         VALUES ($1,$2,'test-hash','CUSTOMER'),($3,$4,'test-hash','CUSTOMER'),
                ($5,$6,'test-hash','ADMIN'),($7,$8,'test-hash','ADMIN')`,
        [
          ids.customer,
          `${ids.customer}@order-api.test`,
          ids.secondCustomer,
          `${ids.secondCustomer}@order-api.test`,
          ids.admin,
          `${ids.admin}@order-api.test`,
          ids.catalogAdmin,
          `${ids.catalogAdmin}@order-api.test`,
        ],
      )
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type)
         VALUES ($1,$2,'test-hash','CUSTOMER')`,
        [ids.emptyCustomer, `${ids.emptyCustomer}@order-api.test`],
      )
      await client.query(
        `INSERT INTO identity_user_roles (user_id,role_code)
         VALUES ($1,'CUSTOMER'),($2,'CUSTOMER'),($3,'GENERAL_ADMIN'),($4,'CATALOG_MANAGER'),($5,'CUSTOMER')`,
        [
          ids.customer,
          ids.secondCustomer,
          ids.admin,
          ids.catalogAdmin,
          ids.emptyCustomer,
        ],
      )
      await client.query(
        'INSERT INTO catalog_categories (id,name) VALUES ($1,$2)',
        [ids.category, `Order API ${ids.category.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id,name) VALUES ($1,$2)',
        [ids.brand, `Order API ${ids.brand.slice(0, 8)}`],
      )
      await client.query(
        `INSERT INTO catalog_products (id,name,brand_id,publication_state)
         VALUES ($1,$3,$2,'PUBLISHED')`,
        [ids.product, ids.brand, `Order API snapshot ${ids.product}`],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)',
        [ids.product, ids.category],
      )
      await client.query(
        `INSERT INTO catalog_product_variants (id,product_id,sku,attributes,price_cents,status)
         VALUES ($1,$2,$3,'{"color":"red"}'::jsonb,5000,'ACTIVE')`,
        [ids.variant, ids.product, `OA-${ids.variant}`],
      )

      const owners = [
        ids.customer,
        ids.customer,
        ids.customer,
        ids.secondCustomer,
      ]
      const statuses = [
        'PENDING_PAYMENT',
        'PAYMENT_CONFIRMED',
        'EXPIRED',
        'PENDING_PAYMENT',
      ]
      const createdAt = [
        '2026-11-03T12:00:00.000Z',
        '2026-11-02T12:00:00.000Z',
        '2026-11-01T12:00:00.000Z',
        '2026-10-31T12:00:00.000Z',
      ]
      for (let index = 0; index < ids.orders.length; index += 1) {
        const orderId = ids.orders[index]!
        await client.query(
          `INSERT INTO carts (id,customer_id,status) VALUES ($1,$2,'CONVERTED')`,
          [ids.carts[index], owners[index]],
        )
        const address = {
          recipientName: 'Cliente de teste',
          cpf: '52998224725',
          phone: '11999991212',
          postalCode: '01310100',
          street: 'Av. Paulista',
          number: '100',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR',
          complement: 'Apto 10',
        }
        await client.query(
          `INSERT INTO orders
            (id,customer_id,cart_id,status,subtotal_cents,discount_cents,
             shipping_cents,total_cents,address_snapshot,payment_due_at,
             expired_at,created_at)
           VALUES ($1,$2,$3,$4,10000,1000,2000,11000,$5::jsonb,
                   CASE WHEN $4::order_status='EXPIRED' THEN now()-interval '1 day'
                        ELSE now()+interval '30 days' END,
                   CASE WHEN $4::order_status='EXPIRED' THEN now() ELSE NULL END,$6)`,
          [
            orderId,
            owners[index],
            ids.carts[index],
            statuses[index],
            JSON.stringify(address),
            createdAt[index],
          ],
        )
        if (index === 1)
          await client.query(
            "UPDATE orders SET coupon_code_snapshot='ORDERAPI-PAID' WHERE id=$1",
            [orderId],
          )
        await client.query(
          'UPDATE carts SET converted_to_order_id=$2 WHERE id=$1',
          [ids.carts[index], orderId],
        )
        await client.query(
          `INSERT INTO order_items
            (id,order_id,product_id,variant_id,product_name_snapshot,
             attributes_snapshot,unit_price_cents,quantity,subtotal_cents,discount_cents)
           VALUES ($1,$2,$3,$4,'Historical product','{"color":"red"}'::jsonb,
                   5000,2,10000,1000)`,
          [ids.items[index], orderId, ids.product, ids.variant],
        )
        await client.query(
          `INSERT INTO shipments
            (id,order_id,status,method,shipping_cents,estimated_business_days,estimated_delivery_date)
           VALUES ($1,$2,'NOT_SHIPPED','STANDARD',2000,5,'2026-11-10')`,
          [ids.shipments[index], orderId],
        )
      }
      await client.query(
        `INSERT INTO payments
          (id,order_id,customer_id,provider,provider_payment_id,method,
           amount_cents,currency,status,idempotency_key,paid_at)
         VALUES ($1,$2,$3,'LOCAL_MOCK',$4,'CREDIT_CARD',11000,'BRL','FAILED',$5,NULL),
                ($6,$7,$8,'LOCAL_MOCK',$9,'PIX',11000,'BRL','APPROVED',$10,now())`,
        [
          ids.payments[0],
          ids.orders[0],
          ids.customer,
          `provider-${ids.payments[0]}`,
          ids.idempotency[0],
          ids.payments[1],
          ids.orders[1],
          ids.customer,
          `provider-${ids.payments[1]}`,
          ids.idempotency[1],
        ],
      )
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
    catalogAdminToken = await createSession(ids.catalogAdmin)
    emptyCustomerToken = await createSession(ids.emptyCustomer)
  })

  afterAll(async () => {
    if (customerToken) await revokeSession(customerToken)
    if (secondCustomerToken) await revokeSession(secondCustomerToken)
    if (adminToken) await revokeSession(adminToken)
    if (catalogAdminToken) await revokeSession(catalogAdminToken)
    if (emptyCustomerToken) await revokeSession(emptyCustomerToken)
    if (!configured) return

    await pool!.query('DELETE FROM payments WHERE order_id=ANY($1::uuid[])', [
      ids.orders,
    ])
    await pool!.query(
      'DELETE FROM order_items WHERE order_id=ANY($1::uuid[])',
      [ids.orders],
    )
    await pool!.query('DELETE FROM shipments WHERE order_id=ANY($1::uuid[])', [
      ids.orders,
    ])
    await pool!.query(
      'UPDATE carts SET converted_to_order_id=NULL WHERE id=ANY($1::uuid[])',
      [ids.carts],
    )
    await pool!.query('DELETE FROM orders WHERE id=ANY($1::uuid[])', [
      ids.orders,
    ])
    await pool!.query('DELETE FROM carts WHERE id=ANY($1::uuid[])', [ids.carts])
    const fixtureProducts = await pool!.query<{
      id: string
      brand_id: string
    }>('SELECT id,brand_id FROM catalog_products WHERE id=$1', [ids.product])
    const productIds = fixtureProducts.rows.map((product) => product.id)
    const categoryRows = productIds.length
      ? await pool!.query<{ category_id: string }>(
          'SELECT category_id FROM catalog_product_categories WHERE product_id=ANY($1::uuid[])',
          [productIds],
        )
      : { rows: [] as Array<{ category_id: string }> }
    const categoryIds = categoryRows.rows.map(
      (category) => category.category_id,
    )
    if (productIds.length) {
      await pool!.query(
        'DELETE FROM catalog_product_variants WHERE product_id=ANY($1::uuid[])',
        [productIds],
      )
      await pool!.query(
        'DELETE FROM catalog_products WHERE id=ANY($1::uuid[])',
        [productIds],
      )
    }
    const brandIds = fixtureProducts.rows.map((product) => product.brand_id)
    if (brandIds.length)
      await pool!.query('DELETE FROM catalog_brands WHERE id=ANY($1::uuid[])', [
        brandIds,
      ])
    if (categoryIds.length)
      await pool!.query(
        'DELETE FROM catalog_categories WHERE id=ANY($1::uuid[])',
        [categoryIds],
      )
    await pool!.query(
      "DELETE FROM identity_users WHERE email LIKE '%@order-api.test'",
    )
  })

  it('returns a paginated customer history with deterministic order and payment summary', async () => {
    const response = await listOrders(
      request('/api/orders?page=1&pageSize=2', customerToken),
    )
    if (!response) throw new Error('Order list route returned no response.')
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      orders: Array<{
        id: string
        status: string
        payment: { status: string } | null
      }>
      page: number
      pageSize: number
      total: number
    }
    expect(body).toMatchObject({ page: 1, pageSize: 2, total: 3 })
    expect(body.orders.map((order) => order.id)).toEqual([
      ids.orders[0],
      ids.orders[1],
    ])
    expect(body.orders[0]?.payment?.status).toBe('FAILED')
    expect(body.orders[1]?.payment?.status).toBe('APPROVED')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('returns an empty history for a customer without orders and requires a session', async () => {
    const empty = await listOrders(request('/api/orders', emptyCustomerToken))
    if (!empty) throw new Error('Empty order history returned no response.')
    expect(empty.status).toBe(200)
    expect(await empty.json()).toMatchObject({ orders: [], total: 0 })

    const unauthenticated = await listOrders(request('/api/orders'))
    if (!unauthenticated)
      throw new Error('Unauthenticated order route returned no response.')
    expect(unauthenticated.status).toBe(401)
  })

  it('returns only the authenticated customer’s orders and hides private identity fields', async () => {
    const own = await getOrder(
      request(`/api/orders/${ids.orders[1]}`, customerToken),
      routeContext(ids.orders[1]),
    )
    expect(own.status).toBe(200)
    const body = (await own.json()) as {
      order: {
        status: string
        totalCents: number
        items: Array<{ productName: string; discountCents: number }>
        address: Record<string, unknown>
        payment: Record<string, unknown>
        shipment: { status: string }
        tracking: unknown
        couponCode: string | null
      }
    }
    expect(body.order).toMatchObject({
      status: 'PAYMENT_CONFIRMED',
      totalCents: 11000,
      items: [{ productName: 'Historical product', discountCents: 1000 }],
      payment: { status: 'APPROVED', amountCents: 11000 },
      shipment: { status: 'NOT_SHIPPED' },
      tracking: null,
      couponCode: 'ORDERAPI-PAID',
    })
    expect(body.order.address.city).toBe('São Paulo')
    expect(body.order.address).not.toHaveProperty('cpf')
    expect(body.order.address).not.toHaveProperty('phone')
    expect(body.order.payment).not.toHaveProperty('providerPaymentId')
    expect(body.order.payment).not.toHaveProperty('idempotencyKey')

    const foreign = await getOrder(
      request(`/api/orders/${ids.orders[3]}`, customerToken),
      routeContext(ids.orders[3]),
    )
    expect(foreign.status).toBe(404)
  })

  it('returns existing shipment data without inventing tracking fields', async () => {
    const response = await getTracking(
      request(`/api/orders/${ids.orders[0]}/tracking`, customerToken),
      routeContext(ids.orders[0]),
    )
    if (!response) throw new Error('Tracking route returned no response.')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      shipment: {
        status: 'NOT_SHIPPED',
        method: 'STANDARD',
        shippingCents: 2000,
        estimatedBusinessDays: 5,
        estimatedDeliveryDate: '2026-11-10',
      },
      tracking: null,
    })
  })

  it('allows only GENERAL_ADMIN to query all orders in read-only routes', async () => {
    const list = await listAdminOrders(request('/api/admin/orders', adminToken))
    if (!list) throw new Error('Admin order list route returned no response.')
    expect(list.status).toBe(200)
    expect((await list.json()).total).toBeGreaterThanOrEqual(4)

    const detail = await getAdminOrder(
      request(`/api/admin/orders/${ids.orders[3]}`, adminToken),
      routeContext(ids.orders[3]),
    )
    expect(detail.status).toBe(200)
    expect((await detail.json()).order.id).toBe(ids.orders[3])

    const denied = await listAdminOrders(
      request('/api/admin/orders', catalogAdminToken),
    )
    if (!denied) throw new Error('Denied admin route returned no response.')
    expect(denied.status).toBe(403)
    const unauthenticated = await listAdminOrders(request('/api/admin/orders'))
    if (!unauthenticated)
      throw new Error('Unauthenticated admin route returned no response.')
    expect(unauthenticated.status).toBe(401)
  })

  it('validates pagination and returns expired orders without changing state', async () => {
    const invalid = await listOrders(
      request('/api/orders?page=0', customerToken),
    )
    if (!invalid) throw new Error('Invalid order query returned no response.')
    expect(invalid.status).toBe(400)
    const expired = await getOrder(
      request(`/api/orders/${ids.orders[2]}`, customerToken),
      routeContext(ids.orders[2]),
    )
    expect(expired.status).toBe(200)
    expect((await expired.json()).order.status).toBe('EXPIRED')
    const stored = await pool!.query<{ status: string }>(
      'SELECT status FROM orders WHERE id=$1',
      [ids.orders[2]],
    )
    expect(stored.rows[0]?.status).toBe('EXPIRED')
  })
})
