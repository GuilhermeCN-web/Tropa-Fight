import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import { PostgresAddressRepository } from '../../src/modules/checkout/infrastructure/postgres-address-repository'
import { PostgresCheckoutRepository } from '../../src/modules/checkout/infrastructure/postgres-checkout-repository'
import { PostgresInventoryRepository } from '../../src/modules/inventory/infrastructure/postgres-inventory-repository'
import { normalizeAddress } from '../../src/modules/checkout/domain/checkout'
import { POST as createAddressApi } from '../../app/api/addresses/route'
import { POST as createQuoteApi } from '../../app/api/checkout/quotes/route'
import { POST as createOrderApi } from '../../app/api/checkout/orders/route'

const configured = Boolean(process.env.DATABASE_URL)
const basePool = configured ? getDatabasePool() : undefined
const schema = `checkout_test_${randomUUID().replaceAll('-', '')}`
const ids = {
  customer: randomUUID(),
  secondCustomer: randomUUID(),
  category: randomUUID(),
  brand: randomUUID(),
  product: randomUUID(),
  variant: randomUUID(),
}
let testPool: Pool | undefined
let addressRepository: PostgresAddressRepository
let checkoutRepository: PostgresCheckoutRepository

describe.skipIf(!configured)('checkout PostgreSQL integration', () => {
  beforeAll(async () => {
    await basePool!.query(`CREATE SCHEMA ${schema}`)
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      application_name: 'tropa-fight-checkout-tests',
    })
    const client = await testPool.connect()
    try {
      await client.query('BEGIN')
      for (let version = 1; version <= 10; version++) {
        const suffix = [
          'identity',
          'audit_logs',
          'catalog',
          'catalog_variants',
          'inventory',
          'cart',
          'promotions_coupons',
          'checkout_orders',
          'order_item_discount_allocation',
          'order_coupon_snapshot',
        ][version - 1]
        const filename = `${String(version).padStart(3, '0')}_${suffix}.sql`
        await client.query(
          await readFile(
            join(process.cwd(), 'db', 'migrations', filename),
            'utf8',
          ),
        )
      }
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type) VALUES ($1,$2,'test-hash','CUSTOMER'),($3,$4,'test-hash','CUSTOMER')`,
        [
          ids.customer,
          `${ids.customer}@checkout.test`,
          ids.secondCustomer,
          `${ids.secondCustomer}@checkout.test`,
        ],
      )
      await client.query(
        "INSERT INTO identity_user_roles (user_id,role_code) VALUES ($1,'CUSTOMER'),($2,'CUSTOMER')",
        [ids.customer, ids.secondCustomer],
      )
      await client.query(
        'INSERT INTO catalog_categories (id,name) VALUES ($1,$2)',
        [ids.category, `Checkout ${ids.category.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id,name) VALUES ($1,$2)',
        [ids.brand, `Checkout ${ids.brand.slice(0, 8)}`],
      )
      await client.query(
        "INSERT INTO catalog_products (id,name,brand_id,publication_state) VALUES ($1,'Fight shirt',$2,'PUBLISHED')",
        [ids.product, ids.brand],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)',
        [ids.product, ids.category],
      )
      await client.query(
        "INSERT INTO catalog_product_variants (id,product_id,sku,attributes,price_cents,status) VALUES ($1,$2,$3,'{}'::jsonb,10000,'ACTIVE')",
        [ids.variant, ids.product, `CO-${ids.variant}`],
      )
      await client.query(
        'INSERT INTO inventory_stocks (variant_id,quantity) VALUES ($1,5)',
        [ids.variant],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    addressRepository = new PostgresAddressRepository(testPool)
    checkoutRepository = new PostgresCheckoutRepository(testPool)
  })

  afterAll(async () => {
    if (!configured) return
    await testPool?.end()
    await basePool!.query(`DROP SCHEMA ${schema} CASCADE`)
  })

  it('snapshots an owned address and order, reserves stock, converts the cart, and is idempotent', async () => {
    const address = await addressRepository.create(
      ids.customer,
      normalizeAddress({
        recipientName: 'Maria Silva',
        cpf: '52998224725',
        phone: '11999991234',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }),
    )
    expect(
      await addressRepository.get(ids.secondCustomer, address.id),
    ).toBeNull()
    const client = await testPool!.connect()
    let cartId = ''
    try {
      const cart = await client.query<{ id: string }>(
        'INSERT INTO carts (id,customer_id) VALUES ($1,$2) RETURNING id',
        [randomUUID(), ids.customer],
      )
      cartId = cart.rows[0]!.id
      await client.query(
        'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,2)',
        [randomUUID(), cartId, ids.variant],
      )
    } finally {
      client.release()
    }

    const quote = await checkoutRepository.createQuote(ids.customer, address.id)
    const alternateAddress = await addressRepository.create(
      ids.customer,
      normalizeAddress({
        recipientName: 'Maria Silva',
        cpf: '52998224725',
        phone: '11999991234',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '200',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }),
    )
    const alternateQuote = await checkoutRepository.createQuote(
      ids.customer,
      alternateAddress.id,
    )
    expect(quote.totalCents).toBe(22000)

    await testPool!.query(`CREATE FUNCTION checkout_test_reject_order_item()
      RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        RAISE EXCEPTION 'injected order item failure';
      END $$`)
    await testPool!.query(`CREATE TRIGGER checkout_test_reject_order_item
      BEFORE INSERT ON order_items FOR EACH ROW
      EXECUTE FUNCTION checkout_test_reject_order_item()`)
    await expect(
      checkoutRepository.createOrder(
        ids.customer,
        quote.quoteId,
        'b13f688f-342b-4c1d-9b8a-36791775c64a',
      ),
    ).rejects.toThrow()
    await testPool!.query(
      'DROP TRIGGER checkout_test_reject_order_item ON order_items',
    )
    await testPool!.query('DROP FUNCTION checkout_test_reject_order_item()')
    await testPool!.query(`CREATE FUNCTION checkout_test_reject_shipment()
      RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        RAISE EXCEPTION 'injected shipment failure';
      END $$`)
    await testPool!.query(`CREATE TRIGGER checkout_test_reject_shipment
      BEFORE INSERT ON shipments FOR EACH ROW
      EXECUTE FUNCTION checkout_test_reject_shipment()`)
    await expect(
      checkoutRepository.createOrder(
        ids.customer,
        quote.quoteId,
        '423d10e6-1382-47b0-b268-e938fcbfdc14',
      ),
    ).rejects.toThrow()
    await testPool!.query(
      'DROP TRIGGER checkout_test_reject_shipment ON shipments',
    )
    await testPool!.query('DROP FUNCTION checkout_test_reject_shipment()')
    const afterRollback = await testPool!.query<{
      orders: string
      reservations: string
    }>(
      `SELECT (SELECT count(*) FROM orders WHERE customer_id=$1)::text orders,
              (SELECT count(*) FROM inventory_reservations)::text reservations`,
      [ids.customer],
    )
    expect(afterRollback.rows[0]).toEqual({ orders: '0', reservations: '0' })

    const order = await checkoutRepository.createOrder(
      ids.customer,
      quote.quoteId,
      'b7b387e6-e7f0-44a1-8df1-1342a237e263',
    )
    if (!('orderId' in order))
      throw new Error('Expected an order after confirming its quote.')
    expect(order).toMatchObject({
      status: 'PENDING_PAYMENT',
      subtotalCents: 20000,
      shippingCents: 2000,
      totalCents: 22000,
      shipmentStatus: 'NOT_SHIPPED',
    })
    expect(
      await checkoutRepository.createOrder(
        ids.customer,
        quote.quoteId,
        'b7b387e6-e7f0-44a1-8df1-1342a237e263',
      ),
    ).toEqual(order)
    await expect(
      checkoutRepository.createOrder(
        ids.customer,
        alternateQuote.quoteId,
        'b7b387e6-e7f0-44a1-8df1-1342a237e263',
      ),
    ).rejects.toThrow(/different content/i)
    await expect(
      checkoutRepository.createOrder(
        ids.customer,
        alternateQuote.quoteId,
        'cf2b4a4f-82c8-45a2-9cfb-b8849d65d710',
      ),
    ).rejects.toThrow(/converted/i)
    const state = await testPool!.query<{
      reservation_count: string
      cart_status: string
      order_items: string
    }>(
      `SELECT (SELECT count(*) FROM inventory_reservations WHERE order_id=$1)::text reservation_count,(SELECT status FROM carts WHERE id=$2) cart_status,(SELECT count(*) FROM order_items WHERE order_id=$1)::text order_items`,
      [order.orderId, cartId],
    )
    expect(state.rows[0]).toEqual({
      reservation_count: '1',
      cart_status: 'CONVERTED',
      order_items: '1',
    })
    await testPool!.query(
      "UPDATE orders SET payment_due_at=now()-interval '1 second' WHERE id=$1",
      [order.orderId],
    )
    const nextCart = await testPool!.query<{ id: string }>(
      'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
      [randomUUID(), ids.customer],
    )
    const activeCart = nextCart.rows[0]?.id ?? cartId
    await testPool!.query(
      'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,1)',
      [randomUUID(), activeCart, ids.variant],
    )
    await checkoutRepository.createQuote(ids.customer, address.id)
    const expired = await testPool!.query<{
      status: string
      released_at: Date | null
    }>(
      `SELECT o.status,ir.released_at FROM orders o JOIN inventory_reservations ir ON ir.order_id=o.id WHERE o.id=$1`,
      [order.orderId],
    )
    expect(expired.rows[0]?.status).toBe('EXPIRED')
    expect(expired.rows[0]?.released_at).toBeTruthy()
  })

  it('rejects unauthenticated address and checkout API requests', async () => {
    const requests = [
      createAddressApi(
        new NextRequest('http://localhost/api/addresses', {
          method: 'POST',
          body: '{}',
        }),
      ),
      createQuoteApi(
        new NextRequest('http://localhost/api/checkout/quotes', {
          method: 'POST',
          body: '{}',
        }),
      ),
      createOrderApi(
        new NextRequest('http://localhost/api/checkout/orders', {
          method: 'POST',
          body: '{}',
        }),
      ),
    ]
    const responses = await Promise.all(requests)
    expect(responses.map((response) => response?.status ?? 0)).toEqual([
      401, 401, 401,
    ])
  })

  it('rejects an empty cart without creating an order', async () => {
    const address = await addressRepository.create(
      ids.secondCustomer,
      normalizeAddress({
        recipientName: 'João Silva',
        cpf: '11144477735',
        phone: '21988887777',
        postalCode: '20040002',
        street: 'Rua da Assembleia',
        number: '10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'BR',
      }),
    )
    const before = await testPool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM orders WHERE customer_id=$1',
      [ids.secondCustomer],
    )
    await expect(
      checkoutRepository.createQuote(ids.secondCustomer, address.id),
    ).rejects.toThrow(/empty/i)
    const after = await testPool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM orders WHERE customer_id=$1',
      [ids.secondCustomer],
    )
    expect(after.rows[0]?.count).toBe(before.rows[0]?.count)
  })

  it('returns a new quote without creating an order when catalog price changes', async () => {
    const address = await addressRepository.create(
      ids.customer,
      normalizeAddress({
        recipientName: 'Maria Silva',
        cpf: '52998224725',
        phone: '11999991234',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }),
    )
    const client = await testPool!.connect()
    try {
      await client.query(
        'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [randomUUID(), ids.customer],
      )
      const cart = await client.query<{ id: string }>(
        "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
        [ids.customer],
      )
      await client.query('DELETE FROM cart_items WHERE cart_id=$1', [
        cart.rows[0]!.id,
      ])
      await client.query(
        'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,1)',
        [randomUUID(), cart.rows[0]!.id, ids.variant],
      )
    } finally {
      client.release()
    }
    const quote = await checkoutRepository.createQuote(ids.customer, address.id)
    await testPool!.query(
      'UPDATE catalog_product_variants SET price_cents=12000 WHERE id=$1',
      [ids.variant],
    )
    const ordersBefore = await testPool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM orders WHERE customer_id=$1',
      [ids.customer],
    )
    const first = await checkoutRepository.createOrder(
      ids.customer,
      quote.quoteId,
      'a8d4677e-5e2e-4e15-8b9f-3690a79210a1',
    )
    expect(first).toHaveProperty('changedQuote')
    expect(
      (first as { changedQuote: { totalCents: number } }).changedQuote
        .totalCents,
    ).toBe(14000)
    const ordersAfter = await testPool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM orders WHERE customer_id=$1',
      [ids.customer],
    )
    expect(ordersAfter.rows[0]?.count).toBe(ordersBefore.rows[0]?.count)
    const active = await testPool!.query<{ id: string }>(
      "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
      [ids.customer],
    )
    await testPool!.query('DELETE FROM cart_items WHERE cart_id=$1', [
      active.rows[0]!.id,
    ])
  })

  it('releases coupon usage when an unpaid order expires', async () => {
    const address = await addressRepository.create(
      ids.customer,
      normalizeAddress({
        recipientName: 'Maria Silva',
        cpf: '52998224725',
        phone: '11999991234',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }),
    )
    const promotionId = randomUUID()
    const couponId = randomUUID()
    const cart = await testPool!.query<{ id: string }>(
      "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
      [ids.customer],
    )
    await testPool!.query(
      `INSERT INTO promotions (id,name,application_type,discount_type,discount_value,starts_at,status,created_by) VALUES ($1,'Expiry test','COUPON','PERCENTAGE',10,now()-interval '1 day','ACTIVE',$2)`,
      [promotionId, ids.customer],
    )
    await testPool!.query(
      `INSERT INTO coupons (id,promotion_id,code,status,usage_limit,created_by) VALUES ($1,$2,$3,'ACTIVE',1,$4)`,
      [
        couponId,
        promotionId,
        `EXP${couponId.replaceAll('-', '').slice(0, 12).toUpperCase()}`,
        ids.customer,
      ],
    )
    await testPool!.query(
      'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,1)',
      [randomUUID(), cart.rows[0]!.id, ids.variant],
    )
    await testPool!.query('UPDATE carts SET applied_coupon_id=$2 WHERE id=$1', [
      cart.rows[0]!.id,
      couponId,
    ])
    const quote = await checkoutRepository.createQuote(ids.customer, address.id)
    const order = await checkoutRepository.createOrder(
      ids.customer,
      quote.quoteId,
      'daff5e6b-8f1d-4903-9e7c-6c2bc844c217',
    )
    if (!('orderId' in order))
      throw new Error('Expected an order with the coupon.')
    await testPool!.query(
      "UPDATE orders SET payment_due_at=now()-interval '1 second' WHERE id=$1",
      [order.orderId],
    )
    const next = await testPool!.query<{ id: string }>(
      'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
      [randomUUID(), ids.customer],
    )
    const nextId =
      next.rows[0]?.id ??
      (
        await testPool!.query<{ id: string }>(
          "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
          [ids.customer],
        )
      ).rows[0]!.id
    await testPool!.query(
      'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,1)',
      [randomUUID(), nextId, ids.variant],
    )
    await testPool!.query('UPDATE carts SET applied_coupon_id=$2 WHERE id=$1', [
      nextId,
      couponId,
    ])
    const reopenedQuote = await checkoutRepository.createQuote(
      ids.customer,
      address.id,
    )
    const redemption = await testPool!.query<{
      released_at: Date | null
      release_reason: string | null
    }>(
      'SELECT released_at,release_reason FROM coupon_redemptions WHERE order_id=$1',
      [order.orderId],
    )
    expect(redemption.rows[0]).toMatchObject({
      release_reason: 'ORDER_EXPIRED',
    })
    expect(redemption.rows[0]?.released_at).toBeTruthy()
    const reopenedOrder = await checkoutRepository.createOrder(
      ids.customer,
      reopenedQuote.quoteId,
      'fb2c7483-562e-4307-a45a-56c8ef8a7c6f',
    )
    expect(reopenedOrder).toHaveProperty('orderId')
    if (!('orderId' in reopenedOrder))
      throw new Error('Expected the repeated coupon to create an order.')
    const allocation = await testPool!.query<{
      item_discount: string
      order_discount: string
      coupon_code_snapshot: string
    }>(
      `SELECT oi.discount_cents::text item_discount,o.discount_cents::text order_discount,o.coupon_code_snapshot FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.id=$1`,
      [reopenedOrder.orderId],
    )
    expect(allocation.rows[0]).toMatchObject({
      item_discount: '1200',
      order_discount: '1200',
    })
    expect(allocation.rows[0]?.coupon_code_snapshot).toMatch(
      /^EXP[A-F0-9]{12}$/,
    )
  })

  it('serializes the last available coupon use across simultaneous orders', async () => {
    const promotionId = randomUUID()
    const couponId = randomUUID()
    await testPool!.query(
      `INSERT INTO promotions (id,name,application_type,discount_type,discount_value,starts_at,status,created_by) VALUES ($1,'Concurrent coupon','COUPON','PERCENTAGE',5,now()-interval '1 day','ACTIVE',$2)`,
      [promotionId, ids.customer],
    )
    await testPool!.query(
      `INSERT INTO coupons (id,promotion_id,code,status,usage_limit,created_by) VALUES ($1,$2,$3,'ACTIVE',1,$4)`,
      [
        couponId,
        promotionId,
        `CC${couponId.replaceAll('-', '').slice(0, 12).toUpperCase()}`,
        ids.customer,
      ],
    )
    const firstAddress = await addressRepository.create(
      ids.customer,
      normalizeAddress({
        recipientName: 'Maria Silva',
        cpf: '52998224725',
        phone: '11999991234',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }),
    )
    const secondAddress = await addressRepository.create(
      ids.secondCustomer,
      normalizeAddress({
        recipientName: 'João Silva',
        cpf: '11144477735',
        phone: '21988887777',
        postalCode: '20040002',
        street: 'Rua da Assembleia',
        number: '10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'BR',
      }),
    )
    const firstCart = await testPool!.query<{ id: string }>(
      'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
      [randomUUID(), ids.customer],
    )
    const firstCartId =
      firstCart.rows[0]?.id ??
      (
        await testPool!.query<{ id: string }>(
          "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
          [ids.customer],
        )
      ).rows[0]!.id
    const secondCart = await testPool!.query<{ id: string }>(
      'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
      [randomUUID(), ids.secondCustomer],
    )
    const secondCartId =
      secondCart.rows[0]?.id ??
      (
        await testPool!.query<{ id: string }>(
          "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
          [ids.secondCustomer],
        )
      ).rows[0]!.id
    for (const cartId of [firstCartId, secondCartId]) {
      await testPool!.query('DELETE FROM cart_items WHERE cart_id=$1', [cartId])
      await testPool!.query(
        'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,1)',
        [randomUUID(), cartId, ids.variant],
      )
      await testPool!.query(
        'UPDATE carts SET applied_coupon_id=$2 WHERE id=$1',
        [cartId, couponId],
      )
    }
    const [firstQuote, secondQuote] = await Promise.all([
      checkoutRepository.createQuote(ids.customer, firstAddress.id),
      checkoutRepository.createQuote(ids.secondCustomer, secondAddress.id),
    ])
    const outcomes = await Promise.all([
      checkoutRepository.createOrder(
        ids.customer,
        firstQuote.quoteId,
        '04f67c53-930c-45e6-9169-72fc5425998f',
      ),
      checkoutRepository.createOrder(
        ids.secondCustomer,
        secondQuote.quoteId,
        '3517c489-b917-4d3e-aedc-106f2503f3a4',
      ),
    ])
    expect(outcomes.filter((result) => 'orderId' in result)).toHaveLength(1)
    expect(outcomes.filter((result) => 'changedQuote' in result)).toHaveLength(
      1,
    )
    const redemptionCount = await testPool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM coupon_redemptions WHERE coupon_id=$1 AND released_at IS NULL',
      [couponId],
    )
    expect(redemptionCount.rows[0]?.count).toBe('1')
  })

  it('serializes competing reservations so stock cannot be oversold', async () => {
    const firstAddress = await addressRepository.create(
      ids.customer,
      normalizeAddress({
        recipientName: 'Maria Silva',
        cpf: '52998224725',
        phone: '11999991234',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }),
    )
    const secondAddress = await addressRepository.create(
      ids.secondCustomer,
      normalizeAddress({
        recipientName: 'João Silva',
        cpf: '11144477735',
        phone: '21988887777',
        postalCode: '20040002',
        street: 'Rua da Assembleia',
        number: '10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'BR',
      }),
    )
    const firstCart = await testPool!.query<{ id: string }>(
      'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
      [randomUUID(), ids.customer],
    )
    const firstCartId =
      firstCart.rows[0]?.id ??
      (
        await testPool!.query<{ id: string }>(
          "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
          [ids.customer],
        )
      ).rows[0]!.id
    const secondCart = await testPool!.query<{ id: string }>(
      'INSERT INTO carts (id,customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
      [randomUUID(), ids.secondCustomer],
    )
    const secondCartId =
      secondCart.rows[0]?.id ??
      (
        await testPool!.query<{ id: string }>(
          "SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE'",
          [ids.secondCustomer],
        )
      ).rows[0]!.id
    await testPool!.query(
      'DELETE FROM cart_items WHERE cart_id=ANY($1::uuid[])',
      [[firstCartId, secondCartId]],
    )
    await testPool!.query(
      'UPDATE carts SET applied_coupon_id=NULL WHERE id=ANY($1::uuid[])',
      [[firstCartId, secondCartId]],
    )
    await testPool!.query(
      'INSERT INTO cart_items (id,cart_id,variant_id,quantity) VALUES ($1,$2,$3,3),($4,$5,$3,3)',
      [randomUUID(), firstCartId, ids.variant, randomUUID(), secondCartId],
    )
    const [firstQuote, secondQuote] = await Promise.all([
      checkoutRepository.createQuote(ids.customer, firstAddress.id),
      checkoutRepository.createQuote(ids.secondCustomer, secondAddress.id),
    ])
    const attempts = await Promise.allSettled([
      checkoutRepository.createOrder(
        ids.customer,
        firstQuote.quoteId,
        '20ef80f9-2041-41d3-9a6c-ef8615d65f24',
      ),
      checkoutRepository.createOrder(
        ids.secondCustomer,
        secondQuote.quoteId,
        '1aa8415a-989a-4c99-9471-b52967214e21',
      ),
    ])
    expect(
      attempts.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    expect(
      attempts.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1)
    const keyCount = await testPool!.query<{ count: string }>(
      'SELECT count(*)::text count FROM checkout_idempotency_keys WHERE idempotency_key=ANY($1::text[])',
      [
        [
          '20ef80f9-2041-41d3-9a6c-ef8615d65f24',
          '1aa8415a-989a-4c99-9471-b52967214e21',
        ],
      ],
    )
    expect(keyCount.rows[0]?.count).toBe('1')
    const activeReserved = await testPool!.query<{ quantity: string }>(
      `SELECT COALESCE(sum(ir.quantity),0)::text quantity FROM inventory_reservations ir JOIN orders o ON o.id=ir.order_id WHERE ir.variant_id=$1 AND ir.released_at IS NULL AND ir.converted_at IS NULL AND ir.expires_at>now() AND o.status='PENDING_PAYMENT' AND o.payment_due_at>now()`,
      [ids.variant],
    )
    expect(Number(activeReserved.rows[0]?.quantity)).toBe(5)
    const inventory = new PostgresInventoryRepository(testPool)
    await expect(
      inventory.createMovement({
        variantId: ids.variant,
        actorId: ids.customer,
        type: 'EXIT',
        quantity: 2,
        reason: 'Reserved stock guard test',
      }),
    ).rejects.toThrow()
  })
})
