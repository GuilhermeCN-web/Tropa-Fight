import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import { parsePaymentWebhookEvent } from '../../src/modules/payments/domain/payment'
import { PaymentService } from '../../src/modules/payments/application/payment-service'
import { LocalMockPaymentGateway } from '../../src/modules/payments/infrastructure/local-mock-payment-gateway'
import { PostgresPaymentRepository } from '../../src/modules/payments/infrastructure/postgres-payment-repository'

const configured = Boolean(process.env.DATABASE_URL)
const basePool = configured ? getDatabasePool() : undefined
const schema = `payment_test_${randomUUID().replaceAll('-', '')}`
const customerId = randomUUID()
const secondCustomerId = randomUUID()
const categoryId = randomUUID()
const brandId = randomUUID()
const productId = randomUUID()
const variantId = randomUUID()
let testPool: Pool | undefined
let service: PaymentService
let repository: PostgresPaymentRepository

describe.skipIf(!configured)('payment PostgreSQL integration', () => {
  beforeAll(async () => {
    await basePool!.query(`CREATE SCHEMA ${schema}`)
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      application_name: 'tropa-fight-payment-tests',
    })
    const client = await testPool.connect()
    try {
      await client.query('BEGIN')
      const migrationNames = [
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
      ]
      for (const filename of migrationNames) {
        await client.query(
          await readFile(
            join(process.cwd(), 'db', 'migrations', filename),
            'utf8',
          ),
        )
      }
      await client.query(
        await readFile(
          join(process.cwd(), 'db', 'migrations', '011_mock_payments.sql'),
          'utf8',
        ),
      )
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type)
         VALUES ($1,$2,'test-hash','CUSTOMER'),($3,$4,'test-hash','CUSTOMER')`,
        [
          customerId,
          `${customerId}@payment.test`,
          secondCustomerId,
          `${secondCustomerId}@payment.test`,
        ],
      )
      await client.query(
        `INSERT INTO identity_user_roles (user_id,role_code)
         VALUES ($1,'CUSTOMER'),($2,'CUSTOMER')`,
        [customerId, secondCustomerId],
      )
      await client.query(
        'INSERT INTO catalog_categories (id,name) VALUES ($1,$2)',
        [categoryId, `Payment ${categoryId.slice(0, 8)}`],
      )
      await client.query(
        'INSERT INTO catalog_brands (id,name) VALUES ($1,$2)',
        [brandId, `Payment ${brandId.slice(0, 8)}`],
      )
      await client.query(
        `INSERT INTO catalog_products (id,name,brand_id,publication_state)
         VALUES ($1,'Payment test product',$2,'PUBLISHED')`,
        [productId, brandId],
      )
      await client.query(
        'INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)',
        [productId, categoryId],
      )
      await client.query(
        `INSERT INTO catalog_product_variants
          (id,product_id,sku,attributes,price_cents,status)
         VALUES ($1,$2,$3,'{}',10000,'ACTIVE')`,
        [variantId, productId, `PT-${variantId}`],
      )
      await client.query(
        'INSERT INTO inventory_stocks (variant_id,quantity) VALUES ($1,20)',
        [variantId],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    repository = new PostgresPaymentRepository(testPool)
    service = new PaymentService(repository, new LocalMockPaymentGateway())
  })

  afterAll(async () => {
    await testPool?.end()
    if (configured) await basePool!.query(`DROP SCHEMA ${schema} CASCADE`)
  })

  async function createOrder(ownerId = customerId) {
    const orderId = randomUUID()
    const cartId = randomUUID()
    const orderItemId = randomUUID()
    const reservationId = randomUUID()
    const client = await testPool!.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        "INSERT INTO carts (id,customer_id,status) VALUES ($1,$2,'CONVERTED')",
        [cartId, ownerId],
      )
      await client.query(
        `INSERT INTO orders
          (id,customer_id,cart_id,status,subtotal_cents,discount_cents,
           shipping_cents,total_cents,address_snapshot,payment_due_at)
         VALUES ($1,$2,$3,'PENDING_PAYMENT',10000,0,2000,12000,'{}',
                 now()+interval '30 days')`,
        [orderId, ownerId, cartId],
      )
      await client.query(
        `INSERT INTO order_items
          (id,order_id,product_id,variant_id,product_name_snapshot,
           attributes_snapshot,unit_price_cents,quantity,subtotal_cents,
           discount_cents)
         VALUES ($1,$2,$3,$4,'Payment test product','{}',10000,1,10000,0)`,
        [orderItemId, orderId, productId, variantId],
      )
      await client.query(
        `INSERT INTO inventory_reservations
          (id,order_id,variant_id,quantity,expires_at)
         VALUES ($1,$2,$3,2,now()+interval '30 days')`,
        [reservationId, orderId, variantId],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    return orderId
  }

  function event(
    paymentId: string,
    orderId: string,
    type: string,
    id = randomUUID(),
  ) {
    return parsePaymentWebhookEvent(
      JSON.stringify({
        id,
        type,
        paymentId,
        orderId,
        amountCents: 12000,
        currency: 'BRL',
        occurredAt: new Date().toISOString(),
      }),
    )
  }

  it('creates only one payment for concurrent requests with the same key', async () => {
    const orderId = await createOrder()
    const idempotencyKey = randomUUID()
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        service.createPayment(
          customerId,
          { orderId, method: 'PIX' },
          idempotencyKey,
        ),
      ),
    )
    expect(new Set(results.map((result) => result.payment.id)).size).toBe(1)
    expect(results.filter((result) => result.created)).toHaveLength(1)
    await expect(
      service.createPayment(
        customerId,
        { orderId, method: 'CREDIT_CARD' },
        idempotencyKey,
      ),
    ).rejects.toThrow('Idempotency key was already used')
    expect(
      await repository.getPayment(secondCustomerId, results[0]!.payment.id),
    ).toBeNull()
  })

  it('processes approval once, converts stock, and ignores stale events', async () => {
    const orderId = await createOrder()
    const before = await testPool!.query<{
      stock: string
      movements: string
    }>(
      `SELECT s.quantity::text AS stock,
              (SELECT count(*)::text FROM inventory_movements
                WHERE variant_id=$1) AS movements
         FROM inventory_stocks s WHERE s.variant_id=$1`,
      [variantId],
    )
    const created = await service.createPayment(
      customerId,
      { orderId, method: 'CREDIT_CARD' },
      randomUUID(),
    )
    const processing = await service.processWebhook(
      event(created.payment.id, orderId, 'payment.processing'),
    )
    expect(processing.kind).toBe('processed')

    const approvalEvent = event(created.payment.id, orderId, 'payment.approved')
    const approvals = await Promise.all([
      service.processWebhook(approvalEvent),
      service.processWebhook(approvalEvent),
    ])
    expect(approvals.map((result) => result.kind).sort()).toEqual([
      'duplicate',
      'processed',
    ])
    expect(
      approvals.find((result) => result.kind === 'processed')?.payment?.status,
    ).toBe('APPROVED')

    const stale = await service.processWebhook(
      event(created.payment.id, orderId, 'payment.processing'),
    )
    expect(stale.kind).toBe('stale')

    const result = await testPool!.query<{
      order_status: string
      stock: string
      converted_at: Date | null
      movements: string
      payment_status: string
    }>(
      `SELECT o.status AS order_status,s.quantity::text AS stock,
              ir.converted_at,
              (SELECT count(*)::text FROM inventory_movements
                WHERE variant_id=$2) AS movements,
              p.status AS payment_status
         FROM orders o
         JOIN inventory_stocks s ON s.variant_id=$2
         JOIN inventory_reservations ir ON ir.order_id=o.id
         JOIN payments p ON p.order_id=o.id
        WHERE o.id=$1`,
      [orderId, variantId],
    )
    expect(result.rows[0]).toMatchObject({
      order_status: 'PAYMENT_CONFIRMED',
      payment_status: 'APPROVED',
    })
    expect(Number(result.rows[0]?.stock)).toBe(
      Number(before.rows[0]?.stock) - 2,
    )
    expect(Number(result.rows[0]?.movements)).toBe(
      Number(before.rows[0]?.movements) + 1,
    )
    expect(result.rows[0]?.converted_at).toBeInstanceOf(Date)
  })

  it('rejects approval after order expiry without converting stock', async () => {
    const before = await testPool!.query<{ stock: string }>(
      'SELECT quantity::text AS stock FROM inventory_stocks WHERE variant_id=$1',
      [variantId],
    )
    const orderId = await createOrder(secondCustomerId)
    const created = await service.createPayment(
      secondCustomerId,
      { orderId, method: 'DEBIT_CARD' },
      randomUUID(),
    )
    await service.processWebhook(
      event(created.payment.id, orderId, 'payment.processing'),
    )
    await testPool!.query(
      "UPDATE orders SET status='EXPIRED',payment_due_at=now()-interval '1 second' WHERE id=$1",
      [orderId],
    )

    const result = await service.processWebhook(
      event(created.payment.id, orderId, 'payment.approved'),
    )
    expect(result).toMatchObject({
      kind: 'rejected',
      reason: 'ORDER_EXPIRED',
      payment: { status: 'PROCESSING' },
    })
    const persisted = await testPool!.query<{
      order_status: string
      payment_status: string
      stock: string
      converted_at: Date | null
    }>(
      `SELECT o.status AS order_status,p.status AS payment_status,
              s.quantity::text AS stock,ir.converted_at
         FROM orders o
         JOIN payments p ON p.order_id=o.id
         JOIN inventory_stocks s ON s.variant_id=$2
         JOIN inventory_reservations ir ON ir.order_id=o.id
        WHERE o.id=$1`,
      [orderId, variantId],
    )
    expect(persisted.rows[0]).toMatchObject({
      order_status: 'EXPIRED',
      payment_status: 'PROCESSING',
      converted_at: null,
    })
    expect(persisted.rows[0]?.stock).toBe(before.rows[0]?.stock)
  })
})
