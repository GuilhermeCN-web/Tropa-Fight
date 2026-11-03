import { createHmac, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import { hashPassword } from '../../src/modules/identity/infrastructure/password-hasher'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { sessionCookieName } from '../../src/modules/auth/application/session-service'

const configured = Boolean(process.env.DATABASE_URL)
const basePool = configured ? getDatabasePool() : undefined
const schema = `task016_${randomUUID().replaceAll('-', '')}`
let pool: Pool | undefined
let testPool: Pool | undefined
type CheckpointRoutes = {
  loginApi: typeof import('../../app/api/auth/login/route').POST
  listProducts: typeof import('../../app/api/products/route').GET
  createAddress: typeof import('../../app/api/addresses/route').POST
  updateAddress: typeof import('../../app/api/addresses/[addressId]/route').PATCH
  getCartApi: typeof import('../../app/api/cart/route').GET
  addCartItem: typeof import('../../app/api/cart/route').POST
  createQuote: typeof import('../../app/api/checkout/quotes/route').POST
  createOrder: typeof import('../../app/api/checkout/orders/route').POST
  createPromotion: typeof import('../../app/api/admin/promotions/route').POST
  createCoupon: typeof import('../../app/api/admin/coupons/route').POST
  applyCoupon: typeof import('../../app/api/cart/coupon/route').POST
  createPayment: typeof import('../../app/api/payments/route').POST
  receiveWebhook: typeof import('../../app/api/payments/webhook/route').POST
  listOrders: typeof import('../../app/api/orders/route').GET
  getOrder: typeof import('../../app/api/orders/[orderId]/route').GET
  getTracking: typeof import('../../app/api/orders/[orderId]/tracking/route').GET
}
let routes: CheckpointRoutes
const ids = {
  customer: randomUUID(),
  otherCustomer: randomUUID(),
  admin: randomUUID(),
  category: randomUUID(),
  brand: randomUUID(),
  product: randomUUID(),
  variant: randomUUID(),
}
let token: string | undefined
let otherCustomerToken: string | undefined
let adminToken: string | undefined
function request(
  path: string,
  method: string,
  body: unknown,
  key?: string,
  sessionToken = token,
) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(sessionToken
        ? { cookie: `${sessionCookieName}=${sessionToken}` }
        : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe.skipIf(!configured)('checkout authenticated API integration', () => {
  beforeAll(async () => {
    await basePool!.query(`CREATE SCHEMA ${schema}`)
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      application_name: 'tropa-fight-task016-checkpoint',
    })
    pool = testPool
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
      ]) {
        await client.query(
          await readFile(
            join(process.cwd(), 'db', 'migrations', filename),
            'utf8',
          ),
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    routes = {
      loginApi: (await import('../../app/api/auth/login/route')).POST,
      listProducts: (await import('../../app/api/products/route')).GET,
      createAddress: (await import('../../app/api/addresses/route')).POST,
      updateAddress: (await import('../../app/api/addresses/[addressId]/route'))
        .PATCH,
      getCartApi: (await import('../../app/api/cart/route')).GET,
      addCartItem: (await import('../../app/api/cart/route')).POST,
      createQuote: (await import('../../app/api/checkout/quotes/route')).POST,
      createOrder: (await import('../../app/api/checkout/orders/route')).POST,
      createPromotion: (await import('../../app/api/admin/promotions/route'))
        .POST,
      createCoupon: (await import('../../app/api/admin/coupons/route')).POST,
      applyCoupon: (await import('../../app/api/cart/coupon/route')).POST,
      createPayment: (await import('../../app/api/payments/route')).POST,
      receiveWebhook: (await import('../../app/api/payments/webhook/route'))
        .POST,
      listOrders: (await import('../../app/api/orders/route')).GET,
      getOrder: (await import('../../app/api/orders/[orderId]/route')).GET,
      getTracking: (
        await import('../../app/api/orders/[orderId]/tracking/route')
      ).GET,
    }
  })

  afterAll(async () => {
    if (token) await revokeSession(token)
    if (otherCustomerToken) await revokeSession(otherCustomerToken)
    if (adminToken) await revokeSession(adminToken)
    await testPool?.end()
    globalThis.identityPool = basePool
    await basePool!.query(`DROP SCHEMA ${schema} CASCADE`)
  })

  it('creates address, quote, and order over authenticated endpoints and replays idempotently', async () => {
    const client = await pool!.connect()
    try {
      await client.query('BEGIN')
      const passwordHash = await hashPassword('ValidPass1!')
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type)
         VALUES ($1,$2,$3,'CUSTOMER'),($4,$5,'test-hash','CUSTOMER'),
                ($6,$7,'test-hash','ADMIN')`,
        [
          ids.customer,
          `${ids.customer}@checkout-api.test`,
          passwordHash,
          ids.otherCustomer,
          `${ids.otherCustomer}@checkout-api.test`,
          ids.admin,
          `${ids.admin}@checkpoint-admin.test`,
        ],
      )
      await client.query(
        `INSERT INTO identity_user_roles (user_id,role_code)
         VALUES ($1,'CUSTOMER'),($2,'CUSTOMER'),($3,'GENERAL_ADMIN')`,
        [ids.customer, ids.otherCustomer, ids.admin],
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
    otherCustomerToken = await createSession(ids.otherCustomer)
    adminToken = await createSession(ids.admin)

    const loginResponse = await routes.loginApi(
      request(
        '/api/auth/login',
        'POST',
        {
          email: `${ids.customer}@checkout-api.test`,
          password: 'ValidPass1!',
        },
        undefined,
        undefined,
      ),
    )
    expect(loginResponse.status).toBe(200)
    token = loginResponse.cookies.get(sessionCookieName)?.value
    expect(token).toBeTruthy()
    const productsResponse = await routes.listProducts(
      new NextRequest(
        `http://localhost/api/products?q=${encodeURIComponent('API checkout product')}`,
      ),
    )
    expect(productsResponse.status).toBe(200)
    expect(
      (await productsResponse.json()).items.map(
        (product: { id: string }) => product.id,
      ),
    ).toContain(ids.product)

    const activeWindow = {
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      status: 'ACTIVE',
    }
    const promotionResponse = await routes.createPromotion(
      request(
        '/api/admin/promotions',
        'POST',
        {
          name: `Checkpoint ${ids.product.slice(0, 8)}`,
          applicationType: 'COUPON',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minimumCartSubtotalCents: 0,
          priority: 1,
          ...activeWindow,
        },
        undefined,
        adminToken,
      ),
    )
    if (!promotionResponse)
      throw new Error('Promotion route returned no response.')
    expect(promotionResponse.status).toBe(201)
    const promotionId = (await promotionResponse.json()).promotion.id
    const couponResponse = await routes.createCoupon(
      request(
        '/api/admin/coupons',
        'POST',
        {
          promotionId,
          code: `E2E${ids.product.slice(0, 8)}`,
          status: 'ACTIVE',
          usageLimit: 2,
          usageLimitPerCustomer: 1,
        },
        undefined,
        adminToken,
      ),
    )
    if (!couponResponse) throw new Error('Coupon route returned no response.')
    expect(couponResponse.status).toBe(201)
    expect((await couponResponse.json()).coupon.code).toBe(
      `E2E${ids.product.slice(0, 8)}`.toUpperCase(),
    )

    const addressResponse = await routes.createAddress(
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

    const cartResponse = await routes.addCartItem(
      request('/api/cart', 'POST', { variantId: ids.variant, quantity: 1 }),
    )
    if (!cartResponse) throw new Error('Cart route returned no response.')
    expect(cartResponse.status).toBe(201)

    const applyCouponResponse = await routes.applyCoupon(
      request('/api/cart/coupon', 'POST', {
        code: `E2E${ids.product.slice(0, 8)}`,
      }),
    )
    if (!applyCouponResponse)
      throw new Error('Coupon apply route returned no response.')
    expect(applyCouponResponse.status).toBe(200)
    expect((await applyCouponResponse.json()).cart).toMatchObject({
      subtotalCents: 5000,
      discount: { amountCents: 500 },
      totalCents: 4500,
    })

    const quoteResponse = await routes.createQuote(
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
    expect(quoteBody.quote.discountCents).toBe(500)
    expect(quoteBody.quote.totalCents).toBe(
      quoteBody.quote.subtotalCents -
        quoteBody.quote.discountCents +
        quoteBody.quote.shipping.shippingCents,
    )

    const key = randomUUID()
    const orderResponse = await routes.createOrder(
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
    const orderId = orderBody.order.orderId
    expect(orderBody.order.status).toBe('PENDING_PAYMENT')
    const replayResponse = await routes.createOrder(
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

    const paymentKey = randomUUID()
    const paymentResponse = await routes.createPayment(
      request('/api/payments', 'POST', { orderId, method: 'PIX' }, paymentKey),
    )
    if (!paymentResponse) throw new Error('Payment route returned no response.')
    expect(paymentResponse.status).toBe(201)
    const paymentBody = (await paymentResponse.json()) as {
      payment: { paymentId: string; status: string; amountCents: number }
    }
    const paymentId = paymentBody.payment.paymentId
    expect(paymentBody.payment).toMatchObject({
      status: 'PENDING',
      amountCents: 6500,
    })
    const replayPaymentResponse = await routes.createPayment(
      request('/api/payments', 'POST', { orderId, method: 'PIX' }, paymentKey),
    )
    if (!replayPaymentResponse)
      throw new Error('Idempotent payment replay returned no response.')
    expect(replayPaymentResponse.status).toBe(200)
    expect((await replayPaymentResponse.json()).payment.paymentId).toBe(
      paymentId,
    )

    const sendWebhook = async (type: string, eventId: string) => {
      const rawBody = JSON.stringify({
        id: eventId,
        type,
        paymentId,
        orderId,
        amountCents: 6500,
        currency: 'BRL',
        occurredAt: new Date().toISOString(),
      })
      const secret = process.env.PAYMENT_WEBHOOK_SECRET
      if (!secret)
        throw new Error(
          'PAYMENT_WEBHOOK_SECRET must be configured for the checkpoint.',
        )
      const signature = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')
      return routes.receiveWebhook(
        new NextRequest('http://localhost/api/payments/webhook', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-payment-signature': `sha256=${signature}`,
          },
          body: rawBody,
        }),
      )
    }
    const invalidWebhookBody = JSON.stringify({
      id: randomUUID(),
      type: 'payment.approved',
      paymentId,
      orderId,
      amountCents: 6500,
      currency: 'BRL',
      occurredAt: new Date().toISOString(),
    })
    const invalidWebhookResponse = await routes.receiveWebhook(
      new NextRequest('http://localhost/api/payments/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-payment-signature': `sha256=${'0'.repeat(64)}`,
        },
        body: invalidWebhookBody,
      }),
    )
    expect(invalidWebhookResponse.status).toBe(401)
    const paymentAfterInvalidWebhook = await pool!.query<{
      payment_status: string
      order_status: string
    }>(
      `SELECT p.status AS payment_status,o.status AS order_status
         FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.id=$1`,
      [paymentId],
    )
    expect(paymentAfterInvalidWebhook.rows[0]).toEqual({
      payment_status: 'PENDING',
      order_status: 'PENDING_PAYMENT',
    })
    const processingEventId = randomUUID()
    const processingResponse = await sendWebhook(
      'payment.processing',
      processingEventId,
    )
    expect(processingResponse.status).toBe(200)
    const approvalEventId = randomUUID()
    const approvalResponse = await sendWebhook(
      'payment.approved',
      approvalEventId,
    )
    expect(approvalResponse.status).toBe(200)
    expect((await approvalResponse.json()).duplicate).toBe(false)
    const duplicateApproval = await sendWebhook(
      'payment.approved',
      approvalEventId,
    )
    expect((await duplicateApproval.json()).duplicate).toBe(true)

    const historyResponse = await routes.listOrders(
      new NextRequest('http://localhost/api/orders', {
        headers: { cookie: `${sessionCookieName}=${token}` },
      }),
    )
    if (!historyResponse)
      throw new Error('Order history route returned no response.')
    expect(historyResponse.status).toBe(200)
    expect((await historyResponse.json()).orders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: orderId, status: 'PAYMENT_CONFIRMED' }),
      ]),
    )
    const detailResponse = await routes.getOrder(
      new NextRequest(`http://localhost/api/orders/${orderId}`, {
        headers: { cookie: `${sessionCookieName}=${token}` },
      }),
      { params: Promise.resolve({ orderId }) },
    )
    expect(detailResponse.status).toBe(200)
    const detail = (await detailResponse.json()).order
    expect(detail).toMatchObject({
      status: 'PAYMENT_CONFIRMED',
      totalCents: 6500,
      couponCode: `E2E${ids.product.slice(0, 8)}`.toUpperCase(),
      payment: { status: 'APPROVED', amountCents: 6500 },
      shipment: {
        status: 'NOT_SHIPPED',
        method: 'STANDARD',
        shippingCents: 2000,
      },
      tracking: null,
    })
    expect(detail.address).not.toHaveProperty('cpf')
    expect(detail.address).not.toHaveProperty('phone')
    const auditCounts = await pool!.query<{
      action: string
      count: string
    }>(
      `SELECT action,count(*)::text AS count FROM audit_logs
        WHERE (action='ORDER_CREATED' AND resource_id=$1)
           OR (action='PAYMENT_CREATED' AND resource_id=$2)
           OR (action='ORDER_PAYMENT_CONFIRMED' AND resource_id=$1)
        GROUP BY action`,
      [orderId, paymentId],
    )
    expect(auditCounts.rows).toEqual(
      expect.arrayContaining([
        { action: 'ORDER_CREATED', count: '1' },
        { action: 'PAYMENT_CREATED', count: '1' },
        { action: 'ORDER_PAYMENT_CONFIRMED', count: '1' },
      ]),
    )
    const foreignDetail = await routes.getOrder(
      new NextRequest(`http://localhost/api/orders/${orderId}`, {
        headers: { cookie: `${sessionCookieName}=${otherCustomerToken}` },
      }),
      { params: Promise.resolve({ orderId }) },
    )
    expect(foreignDetail.status).toBe(404)
    const trackingResponse = await routes.getTracking(
      new NextRequest(`http://localhost/api/orders/${orderId}/tracking`, {
        headers: { cookie: `${sessionCookieName}=${token}` },
      }),
      { params: Promise.resolve({ orderId }) },
    )
    expect(await trackingResponse.json()).toEqual({
      shipment: expect.objectContaining({ status: 'NOT_SHIPPED' }),
      tracking: null,
    })

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

    const updatedAddress = await routes.updateAddress(
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

    const nextCartResponse = await routes.getCartApi(
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
