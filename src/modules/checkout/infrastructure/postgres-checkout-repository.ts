import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import { loadCart } from '../../cart/infrastructure/postgres-cart-repository'
import type { Cart } from '../../cart/domain/cart'
import type {
  ShippingCalculator,
  ShippingQuote,
} from '../../shipping/application/shipping-calculator'
import { LocalShippingCalculator } from '../../shipping/infrastructure/local-shipping-calculator'
import {
  allocateDiscountAcrossItems,
  CheckoutError,
  type AddressSnapshot,
} from '../domain/checkout'

type QuoteSnapshot = {
  address: AddressSnapshot
  appliedCoupon: Cart['appliedCoupon']
  items: Array<{
    variantId: string
    productName: string
    attributes: Record<string, string>
    quantity: number
    unitPriceCents: number
    subtotalCents: number
  }>
  subtotalCents: number
  discount: Cart['discount']
  discountCents: number
  shipping: ShippingQuote
  totalCents: number
}

async function transaction<T>(
  pool: Pool,
  action: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await action(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function expireDueOrders(client: PoolClient) {
  const expired = await client.query<{ id: string; customer_id: string }>(
    `UPDATE orders SET status='EXPIRED', expired_at=now(), updated_at=now()
      WHERE status='PENDING_PAYMENT' AND payment_due_at <= now()
      RETURNING id, customer_id`,
  )
  for (const order of expired.rows) {
    await client.query(
      `UPDATE inventory_reservations SET released_at=now()
      WHERE order_id=$1 AND released_at IS NULL AND converted_at IS NULL`,
      [order.id],
    )
    await client.query(
      `UPDATE coupon_redemptions SET released_at=now(), release_reason='ORDER_EXPIRED'
      WHERE order_id=$1 AND released_at IS NULL`,
      [order.id],
    )
    await insertAuditEvent(
      client,
      createAuditEvent({
        actorId: order.customer_id,
        action: 'ORDER_EXPIRED',
        resourceType: 'Order',
        resourceId: order.id,
        result: 'SUCCESS',
        source: 'checkout.expiration',
      }),
    )
  }
}

function snapshot(
  cart: Cart,
  address: AddressSnapshot,
  now: Date,
  shippingCalculator: ShippingCalculator,
): QuoteSnapshot {
  const shipping = shippingCalculator.calculate(address.postalCode, now)
  const discountCents = cart.discount?.amountCents ?? 0
  return {
    address,
    appliedCoupon: cart.appliedCoupon,
    items: cart.items.map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      attributes: item.attributes,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.subtotalCents,
    })),
    subtotalCents: cart.subtotalCents,
    discount: cart.discount,
    discountCents,
    shipping,
    totalCents: cart.subtotalCents - discountCents + shipping.shippingCents,
  }
}

function publicQuote(id: string, value: QuoteSnapshot) {
  return { quoteId: id, ...value }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    )
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

async function activeCartId(client: PoolClient, customerId: string) {
  await client.query(
    `INSERT INTO carts (id, customer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [randomUUID(), customerId],
  )
  const result = await client.query<{ id: string }>(
    `SELECT id FROM carts WHERE customer_id=$1 AND status='ACTIVE' FOR UPDATE`,
    [customerId],
  )
  const id = result.rows[0]?.id
  if (!id) throw new CheckoutError('Active cart not found.', 'NOT_FOUND')
  return id
}

async function addressSnapshot(
  client: PoolClient,
  customerId: string,
  addressId: string,
): Promise<AddressSnapshot> {
  const result = await client.query<{
    recipient_name: string
    cpf: string
    phone: string
    postal_code: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    country: string
    complement: string | null
    reference: string | null
  }>(
    `SELECT recipient_name, cpf, phone, postal_code, street, number, neighborhood, city, state, country, complement, reference FROM customer_addresses WHERE id=$1 AND customer_id=$2 FOR SHARE`,
    [addressId, customerId],
  )
  const row = result.rows[0]
  if (!row) throw new CheckoutError('Address not found.', 'NOT_FOUND')
  return {
    recipientName: row.recipient_name,
    cpf: row.cpf,
    phone: row.phone,
    postalCode: row.postal_code,
    street: row.street,
    number: row.number,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    ...(row.complement ? { complement: row.complement } : {}),
    ...(row.reference ? { reference: row.reference } : {}),
  }
}

export class PostgresCheckoutRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
    this.shippingCalculator = new LocalShippingCalculator()
  }

  private readonly shippingCalculator: ShippingCalculator

  async createQuote(customerId: string, addressId: string) {
    return transaction(this.pool, async (client) => {
      await expireDueOrders(client)
      const cartId = await activeCartId(client, customerId)
      const cart = await loadCart(client, cartId, customerId)
      if (!cart.items.length)
        throw new CheckoutError('Cart is empty.', 'CART_EMPTY')
      if (cart.items.some((item) => item.quantity > item.availableQuantity))
        throw new CheckoutError(
          'Insufficient stock for checkout.',
          'STOCK_UNAVAILABLE',
        )
      const address = await addressSnapshot(client, customerId, addressId)
      const value = snapshot(cart, address, new Date(), this.shippingCalculator)
      const id = randomUUID()
      await client.query(
        `INSERT INTO checkout_quotes (id,customer_id,cart_id,address_id,snapshot) VALUES ($1,$2,$3,$4,$5::jsonb)`,
        [id, customerId, cartId, addressId, JSON.stringify(value)],
      )
      return publicQuote(id, value)
    })
  }

  async createOrder(customerId: string, quoteId: string, key: string) {
    return transaction(this.pool, async (client) => {
      await expireDueOrders(client)
      const quoteResult = await client.query<{
        id: string
        cart_id: string
        address_id: string
        snapshot: QuoteSnapshot
        consumed_by_order_id: string | null
      }>(
        `SELECT id,cart_id,address_id,snapshot,consumed_by_order_id FROM checkout_quotes WHERE id=$1 AND customer_id=$2 FOR UPDATE`,
        [quoteId, customerId],
      )
      const quote = quoteResult.rows[0]
      if (!quote) throw new CheckoutError('Quote not found.', 'NOT_FOUND')
      const quoteSnapshot =
        typeof quote.snapshot === 'string'
          ? (JSON.parse(quote.snapshot) as QuoteSnapshot)
          : quote.snapshot
      const fingerprint = createHash('sha256')
        .update(canonicalJson(quoteSnapshot))
        .digest('hex')
      const priorKey = await client.query<{
        request_fingerprint: string
        order_id: string
      }>(
        `SELECT request_fingerprint,order_id FROM checkout_idempotency_keys WHERE customer_id=$1 AND idempotency_key=$2 FOR UPDATE`,
        [customerId, key],
      )
      if (priorKey.rowCount) {
        if (priorKey.rows[0]!.request_fingerprint !== fingerprint)
          throw new CheckoutError(
            'Idempotency key was already used with different content.',
            'CONFLICT',
          )
        return this.readOrder(client, priorKey.rows[0]!.order_id)
      }
      if (quote.consumed_by_order_id)
        return this.readOrder(client, quote.consumed_by_order_id)

      const cartLock = await client.query<{ status: string }>(
        `SELECT status FROM carts WHERE id=$1 AND customer_id=$2 FOR UPDATE`,
        [quote.cart_id, customerId],
      )
      if (!cartLock.rowCount || cartLock.rows[0]?.status !== 'ACTIVE')
        throw new CheckoutError(
          'This cart has already been converted into an order.',
          'CONFLICT',
        )
      const cartVariants = await client.query<{
        id: string
        product_id: string
      }>(
        `SELECT v.id, v.product_id
           FROM cart_items ci
           JOIN catalog_product_variants v ON v.id=ci.variant_id
           JOIN catalog_products p ON p.id=v.product_id
           JOIN catalog_brands b ON b.id=p.brand_id
          WHERE ci.cart_id=$1
          ORDER BY v.id
          FOR SHARE OF v,p,b`,
        [quote.cart_id],
      )
      const cartCoupon = await client.query<{
        applied_coupon_id: string | null
      }>('SELECT applied_coupon_id FROM carts WHERE id=$1', [quote.cart_id])
      if (cartCoupon.rows[0]?.applied_coupon_id) {
        const coupon = await client.query<{ promotion_id: string }>(
          'SELECT promotion_id FROM coupons WHERE id=$1 FOR UPDATE',
          [cartCoupon.rows[0].applied_coupon_id],
        )
        if (coupon.rows[0])
          await client.query(
            'SELECT id FROM promotions WHERE id=$1 FOR SHARE',
            [coupon.rows[0].promotion_id],
          )
      }
      const cart = await loadCart(client, quote.cart_id, customerId)
      if (!cart.items.length)
        throw new CheckoutError('Cart is empty.', 'CART_EMPTY')
      if (cart.items.some((item) => item.quantity > item.availableQuantity))
        throw new CheckoutError(
          'Insufficient stock for checkout.',
          'STOCK_UNAVAILABLE',
        )
      const address = await addressSnapshot(
        client,
        customerId,
        quote.address_id,
      )
      const currentSnapshot = snapshot(
        cart,
        address,
        new Date(),
        this.shippingCalculator,
      )
      if (canonicalJson(currentSnapshot) !== canonicalJson(quoteSnapshot)) {
        const newId = randomUUID()
        await client.query(
          'INSERT INTO checkout_quotes (id,customer_id,cart_id,address_id,snapshot) VALUES ($1,$2,$3,$4,$5::jsonb)',
          [
            newId,
            customerId,
            quote.cart_id,
            quote.address_id,
            JSON.stringify(currentSnapshot),
          ],
        )
        return { changedQuote: publicQuote(newId, currentSnapshot) }
      }

      const id = randomUUID()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const discount = currentSnapshot.discount
      const itemDiscounts = allocateDiscountAcrossItems(
        cart.items.map((item) => ({
          variantId: item.variantId,
          subtotalCents: item.subtotalCents,
        })),
        currentSnapshot.discountCents,
      )
      const couponId = cart.appliedCoupon?.id ?? null
      if (couponId) {
        const counts = await client.query<{
          global_count: string
          customer_count: string
          usage_limit: string | null
          customer_limit: string | null
        }>(
          `SELECT count(r.id)::text global_count, count(r.id) FILTER (WHERE r.customer_id=$2)::text customer_count, c.usage_limit::text usage_limit, c.usage_limit_per_customer::text customer_limit FROM coupons c LEFT JOIN coupon_redemptions r ON r.coupon_id=c.id AND r.released_at IS NULL AND (r.order_id IS NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.id=r.order_id AND o.status<>'EXPIRED' AND (o.status<>'PENDING_PAYMENT' OR o.payment_due_at>now()))) WHERE c.id=$1 GROUP BY c.id`,
          [couponId, customerId],
        )
        const used = counts.rows[0]
        if (
          !used ||
          (used.usage_limit !== null &&
            Number(used.global_count) >= Number(used.usage_limit)) ||
          (used.customer_limit !== null &&
            Number(used.customer_count) >= Number(used.customer_limit))
        )
          throw new CheckoutError(
            'Coupon usage limit has been reached.',
            'COUPON_INVALID',
          )
      }

      const variantIds = cart.items.map((item) => item.variantId)
      if (variantIds.length) {
        await client.query(
          `INSERT INTO inventory_stocks (variant_id,quantity)
           SELECT variant_id,0 FROM unnest($1::uuid[]) AS s(variant_id)
           ON CONFLICT (variant_id) DO NOTHING`,
          [variantIds],
        )
      }
      const stockRows = await client.query<{
        variant_id: string
        quantity: string
      }>(
        `SELECT variant_id,quantity::text AS quantity
           FROM inventory_stocks WHERE variant_id=ANY($1::uuid[])
          ORDER BY variant_id FOR UPDATE`,
        [variantIds],
      )
      const reservedRows = await client.query<{
        variant_id: string
        quantity: string
      }>(
        `SELECT ir.variant_id,COALESCE(sum(ir.quantity),0)::text AS quantity
           FROM inventory_reservations ir JOIN orders o ON o.id=ir.order_id
          WHERE ir.variant_id=ANY($1::uuid[]) AND ir.released_at IS NULL
            AND ir.converted_at IS NULL AND ir.expires_at>now()
            AND o.status='PENDING_PAYMENT' AND o.payment_due_at>now()
          GROUP BY ir.variant_id`,
        [variantIds],
      )
      const stockByVariant = new Map(
        stockRows.rows.map((row) => [row.variant_id, BigInt(row.quantity)]),
      )
      const reservedByVariant = new Map(
        reservedRows.rows.map((row) => [row.variant_id, BigInt(row.quantity)]),
      )
      for (const item of cart.items) {
        const stock = stockByVariant.get(item.variantId)
        const reserved = reservedByVariant.get(item.variantId) ?? 0n
        if (stock === undefined || stock - reserved < BigInt(item.quantity))
          throw new CheckoutError(
            'Insufficient stock for checkout.',
            'STOCK_UNAVAILABLE',
          )
      }

      await client.query(
        `INSERT INTO orders (id,customer_id,cart_id,status,subtotal_cents,discount_cents,shipping_cents,total_cents,coupon_id,coupon_code_snapshot,discount_source,discount_reference_id,discount_label,address_snapshot,payment_due_at) VALUES ($1,$2,$3,'PENDING_PAYMENT',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)`,
        [
          id,
          customerId,
          quote.cart_id,
          currentSnapshot.subtotalCents,
          currentSnapshot.discountCents,
          currentSnapshot.shipping.shippingCents,
          currentSnapshot.totalCents,
          couponId,
          currentSnapshot.appliedCoupon?.code ?? null,
          discount?.source ?? null,
          discount?.id ?? null,
          discount?.label ?? null,
          JSON.stringify(address),
          expiresAt,
        ],
      )
      const productByVariant = new Map(
        cartVariants.rows.map((variant) => [variant.id, variant.product_id]),
      )
      const orderItemRows = cart.items.map((item) => {
        const productId = productByVariant.get(item.variantId)
        if (!productId)
          throw new CheckoutError(
            'Cart item is unavailable.',
            'STOCK_UNAVAILABLE',
          )
        return {
          id: randomUUID(),
          product_id: productId,
          variant_id: item.variantId,
          product_name_snapshot: item.productName,
          attributes_snapshot: item.attributes,
          unit_price_cents: item.unitPriceCents,
          quantity: item.quantity,
          subtotal_cents: item.subtotalCents,
          discount_cents: itemDiscounts.get(item.variantId) ?? 0,
        }
      })
      await client.query(
        `INSERT INTO order_items
          (id,order_id,product_id,variant_id,product_name_snapshot,
           attributes_snapshot,unit_price_cents,quantity,subtotal_cents,discount_cents)
         SELECT x.id,$1,x.product_id,x.variant_id,x.product_name_snapshot,
                x.attributes_snapshot,x.unit_price_cents,x.quantity,
                x.subtotal_cents,x.discount_cents
           FROM jsonb_to_recordset($2::jsonb) AS x(
             id uuid,product_id uuid,variant_id uuid,product_name_snapshot text,
             attributes_snapshot jsonb,unit_price_cents bigint,quantity bigint,
             subtotal_cents bigint,discount_cents bigint)`,
        [id, JSON.stringify(orderItemRows)],
      )
      const reservationRows = cart.items.map((item) => ({
        id: randomUUID(),
        variant_id: item.variantId,
        quantity: item.quantity,
      }))
      await client.query(
        `INSERT INTO inventory_reservations
          (id,order_id,variant_id,quantity,expires_at)
         SELECT x.id,$1,x.variant_id,x.quantity,$2
           FROM jsonb_to_recordset($3::jsonb) AS x(
             id uuid,variant_id uuid,quantity bigint)`,
        [id, expiresAt, JSON.stringify(reservationRows)],
      )
      await client.query(
        `INSERT INTO shipments (id,order_id,status,method,shipping_cents,estimated_business_days,estimated_delivery_date) VALUES ($1,$2,'NOT_SHIPPED','STANDARD',$3,5,$4)`,
        [
          randomUUID(),
          id,
          currentSnapshot.shipping.shippingCents,
          currentSnapshot.shipping.estimatedDeliveryDate,
        ],
      )
      if (couponId)
        await client.query(
          'INSERT INTO coupon_redemptions (id,coupon_id,customer_id,order_id) VALUES ($1,$2,$3,$4)',
          [randomUUID(), couponId, customerId, id],
        )
      await client.query(
        `UPDATE carts SET status='CONVERTED',converted_to_order_id=$2,updated_at=now() WHERE id=$1`,
        [quote.cart_id, id],
      )
      await client.query(
        'UPDATE checkout_quotes SET consumed_by_order_id=$2 WHERE id=$1',
        [quoteId, id],
      )
      await client.query(
        'INSERT INTO checkout_idempotency_keys (customer_id,idempotency_key,request_fingerprint,order_id) VALUES ($1,$2,$3,$4)',
        [customerId, key, fingerprint, id],
      )
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: customerId,
          action: 'ORDER_CREATED',
          resourceType: 'Order',
          resourceId: id,
          result: 'SUCCESS',
          source: 'checkout.order',
        }),
      )
      return this.readOrder(client, id)
    })
  }

  private async readOrder(client: PoolClient, id: string) {
    const result = await client.query<{
      id: string
      status: string
      subtotal_cents: string
      discount_cents: string
      shipping_cents: string
      total_cents: string
      payment_due_at: Date
      created_at: Date
    }>(
      `SELECT id,status,subtotal_cents::text,discount_cents::text,shipping_cents::text,total_cents::text,payment_due_at,created_at FROM orders WHERE id=$1`,
      [id],
    )
    const row = result.rows[0]
    if (!row) throw new CheckoutError('Order not found.', 'NOT_FOUND')
    return {
      orderId: row.id,
      status: row.status,
      subtotalCents: Number(row.subtotal_cents),
      discountCents: Number(row.discount_cents),
      shippingCents: Number(row.shipping_cents),
      totalCents: Number(row.total_cents),
      shipmentStatus: 'NOT_SHIPPED',
      paymentDueAt: row.payment_due_at.toISOString(),
      createdAt: row.created_at.toISOString(),
    }
  }
}
