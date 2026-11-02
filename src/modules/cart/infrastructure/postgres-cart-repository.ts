import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import {
  calculateCartTotals,
  calculateItemSubtotal,
  CartError,
  type Cart,
  type CartItem,
} from '../domain/cart'
import type { CartRepository } from '../application/cart-repository'
import {
  selectBestDiscount,
  type DiscountCandidate,
} from '../../pricing/domain/discount'
import {
  isWithinPromotionWindow,
  PromotionError,
} from '../../promotions/domain/promotion'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'

type CartRow = {
  id: string
  applied_coupon_id: string | null
  created_at: Date
  updated_at: Date
}

type CartItemRow = {
  id: string
  variant_id: string
  product_name: string
  attributes: { size?: string; color?: string }
  quantity: string
  price_cents: string
  available_quantity: string
  created_at: Date
  updated_at: Date
}

type VariantRow = {
  id: string
  price_cents: string
  available_quantity: string
  eligible: boolean
}

type CouponSnapshot = {
  id: string
  promotion_id: string
  code: string
  status: string
  usage_limit: string | null
  usage_limit_per_customer: string | null
  redeemed_count: string
  customer_redeemed_count: string
  application_type: string
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: string
  minimum_cart_subtotal_cents: string | null
  promotion_status: string
  starts_at: Date
  expires_at: Date | null
}

type PromotionCandidateRow = {
  id: string
  name: string
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: string
  minimum_cart_subtotal_cents: string | null
  priority: number
  starts_at: Date
  expires_at: Date | null
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

function safeNumber(value: string, label: string): number {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Stored ${label} exceeds the supported safe integer.`)
  }
  return number
}

function toCartItem(row: CartItemRow): CartItem {
  const quantity = safeNumber(row.quantity, 'cart quantity')
  const unitPriceCents = safeNumber(row.price_cents, 'variant price')
  const availableQuantity = safeNumber(
    row.available_quantity,
    'inventory balance',
  )
  return {
    id: row.id,
    variantId: row.variant_id,
    productName: row.product_name,
    attributes: row.attributes,
    quantity,
    unitPriceCents,
    subtotalCents: calculateItemSubtotal(unitPriceCents, quantity),
    availableQuantity,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

const cartItemsQuery = `
  SELECT ci.id, ci.variant_id, p.name AS product_name, v.attributes,
         ci.quantity::text AS quantity, v.price_cents::text AS price_cents,
         GREATEST(COALESCE(s.quantity, 0) - COALESCE((
           SELECT sum(ir.quantity) FROM inventory_reservations ir
           JOIN orders o ON o.id = ir.order_id
            WHERE ir.variant_id = v.id AND ir.released_at IS NULL
              AND ir.converted_at IS NULL AND ir.expires_at > now()
              AND o.status = 'PENDING_PAYMENT' AND o.payment_due_at > now()
         ), 0), 0)::text AS available_quantity,
         ci.created_at, ci.updated_at
    FROM cart_items ci
    JOIN catalog_product_variants v ON v.id = ci.variant_id
    JOIN catalog_products p ON p.id = v.product_id
    LEFT JOIN inventory_stocks s ON s.variant_id = v.id
   WHERE ci.cart_id = $1
   ORDER BY ci.created_at, ci.id`

async function loadCouponSnapshot(
  client: PoolClient,
  couponId: string,
  customerId: string,
): Promise<CouponSnapshot | null> {
  const result = await client.query<CouponSnapshot>(
    `SELECT c.id, c.promotion_id, c.code, c.status,
            c.usage_limit::text AS usage_limit,
            c.usage_limit_per_customer::text AS usage_limit_per_customer,
            count(r.id) FILTER (WHERE r.released_at IS NULL AND
              (o.id IS NULL OR (o.status <> 'EXPIRED' AND
               (o.status <> 'PENDING_PAYMENT' OR o.payment_due_at > now()))))::text AS redeemed_count,
            count(r.id) FILTER (WHERE r.customer_id = $2 AND r.released_at IS NULL AND
              (o.id IS NULL OR (o.status <> 'EXPIRED' AND
               (o.status <> 'PENDING_PAYMENT' OR o.payment_due_at > now()))))::text
              AS customer_redeemed_count,
            p.application_type, p.discount_type, p.discount_value::text AS discount_value,
            p.minimum_cart_subtotal_cents::text AS minimum_cart_subtotal_cents,
            p.status AS promotion_status, p.starts_at, p.expires_at
       FROM coupons c
       JOIN promotions p ON p.id = c.promotion_id
       LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
       LEFT JOIN orders o ON o.id = r.order_id
      WHERE c.id = $1
      GROUP BY c.id, p.id`,
    [couponId, customerId],
  )
  return result.rows[0] ?? null
}

export async function loadCart(
  client: PoolClient,
  cartId: string,
  customerId: string,
): Promise<Cart> {
  const cartResult = await client.query<CartRow>(
    'SELECT id, applied_coupon_id, created_at, updated_at FROM carts WHERE id = $1',
    [cartId],
  )
  const cart = cartResult.rows[0]
  if (!cart) throw new CartError('Cart not found.', 'NOT_FOUND')
  const itemResult = await client.query<CartItemRow>(cartItemsQuery, [cartId])
  const items = itemResult.rows.map(toCartItem)
  const totals = calculateCartTotals(items)
  const now = new Date()
  const promotionsResult = await client.query<PromotionCandidateRow>(
    `SELECT id, name, discount_type, discount_value::text AS discount_value,
            minimum_cart_subtotal_cents::text AS minimum_cart_subtotal_cents,
            priority, starts_at, expires_at
       FROM promotions
      WHERE application_type = 'AUTOMATIC' AND status = 'ACTIVE'`,
  )
  const candidates: DiscountCandidate[] = promotionsResult.rows
    .filter(
      (promotion) =>
        isWithinPromotionWindow(
          promotion.starts_at.toISOString(),
          promotion.expires_at?.toISOString() ?? null,
          now,
        ) &&
        (promotion.minimum_cart_subtotal_cents === null ||
          safeNumber(
            promotion.minimum_cart_subtotal_cents,
            'promotion minimum subtotal',
          ) <= totals.subtotalCents),
    )
    .map((promotion) => ({
      id: promotion.id,
      source: 'PROMOTION' as const,
      kind: promotion.discount_type,
      value: safeNumber(promotion.discount_value, 'promotion discount value'),
      priority: promotion.priority,
      label: promotion.name,
    }))

  let appliedCoupon: Cart['appliedCoupon'] = null
  let couponRemoved = false
  if (cart.applied_coupon_id) {
    const coupon = await loadCouponSnapshot(
      client,
      cart.applied_coupon_id,
      customerId,
    )
    if (coupon && !couponError(coupon, totals.subtotalCents, now)) {
      appliedCoupon = { id: coupon.id, code: coupon.code }
      candidates.push({
        id: coupon.promotion_id,
        source: 'COUPON',
        kind: coupon.discount_type,
        value: safeNumber(coupon.discount_value, 'coupon discount value'),
        priority: 0,
        label: coupon.code,
      })
    } else {
      await client.query(
        'UPDATE carts SET applied_coupon_id = NULL, updated_at = now() WHERE id = $1',
        [cartId],
      )
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: customerId,
          action: 'COUPON_REMOVED',
          resourceType: 'Cart',
          resourceId: cartId,
          result: 'SUCCESS',
          source: 'cart.recalculation',
        }),
      )
      couponRemoved = true
    }
  }

  const discount = selectBestDiscount(totals.subtotalCents, candidates)
  const totalCents = totals.subtotalCents - (discount?.amountCents ?? 0)
  return {
    id: cart.id,
    items,
    ...totals,
    discount,
    totalCents,
    appliedCoupon,
    ...(couponRemoved ? { couponRemoved: true } : {}),
    createdAt: cart.created_at.toISOString(),
    updatedAt: cart.updated_at.toISOString(),
  }
}

function couponError(
  coupon: CouponSnapshot,
  subtotalCents: number,
  now: Date,
): PromotionError | null {
  if (coupon.status !== 'ACTIVE' || coupon.promotion_status !== 'ACTIVE') {
    return new PromotionError('Coupon is inactive.', 'COUPON_INACTIVE')
  }
  if (coupon.application_type !== 'COUPON') {
    return new PromotionError(
      'Coupon is not applicable.',
      'COUPON_NOT_APPLICABLE',
    )
  }
  if (coupon.starts_at.getTime() > now.getTime()) {
    return new PromotionError('Coupon is not active yet.', 'COUPON_NOT_STARTED')
  }
  if (coupon.expires_at && now.getTime() >= coupon.expires_at.getTime()) {
    return new PromotionError('Coupon has expired.', 'COUPON_EXPIRED')
  }
  if (
    coupon.usage_limit !== null &&
    safeNumber(coupon.redeemed_count, 'coupon redemption count') >=
      safeNumber(coupon.usage_limit, 'coupon usage limit')
  ) {
    return new PromotionError(
      'Coupon usage limit has been reached.',
      'COUPON_USAGE_LIMIT_REACHED',
    )
  }
  if (
    coupon.usage_limit_per_customer !== null &&
    safeNumber(
      coupon.customer_redeemed_count,
      'customer coupon redemption count',
    ) >=
      safeNumber(
        coupon.usage_limit_per_customer,
        'per-customer coupon usage limit',
      )
  ) {
    return new PromotionError(
      'Coupon customer usage limit has been reached.',
      'COUPON_CUSTOMER_LIMIT_REACHED',
    )
  }
  if (
    coupon.minimum_cart_subtotal_cents !== null &&
    safeNumber(coupon.minimum_cart_subtotal_cents, 'coupon minimum subtotal') >
      subtotalCents
  ) {
    return new PromotionError(
      'Cart subtotal does not meet the coupon minimum.',
      'COUPON_MINIMUM_AMOUNT_NOT_MET',
    )
  }
  return null
}

async function createOrLockCart(
  client: PoolClient,
  customerId: string,
): Promise<string> {
  await client.query(
    `INSERT INTO carts (id, customer_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [randomUUID(), customerId],
  )
  const result = await client.query<CartRow>(
    "SELECT id, created_at, updated_at FROM carts WHERE customer_id = $1 AND status = 'ACTIVE' FOR UPDATE",
    [customerId],
  )
  const cartId = result.rows[0]?.id
  if (!cartId) throw new CartError('Cart could not be created.', 'CONFLICT')
  return cartId
}

async function readEligibleVariant(
  client: PoolClient,
  variantId: string,
): Promise<VariantRow> {
  const result = await client.query<VariantRow>(
    `SELECT v.id, v.price_cents::text AS price_cents,
            GREATEST(COALESCE(s.quantity, 0) - COALESCE((
              SELECT sum(ir.quantity) FROM inventory_reservations ir
              JOIN orders o ON o.id=ir.order_id
               WHERE ir.variant_id=v.id AND ir.released_at IS NULL
                 AND ir.converted_at IS NULL AND ir.expires_at>now()
                 AND o.status='PENDING_PAYMENT' AND o.payment_due_at>now()
            ),0),0)::text AS available_quantity,
            (v.status = 'ACTIVE' AND p.publication_state = 'PUBLISHED'
              AND b.status = 'ACTIVE'
              AND EXISTS (SELECT 1 FROM catalog_product_categories pc
                           WHERE pc.product_id = p.id)
              AND NOT EXISTS (
                SELECT 1 FROM catalog_product_categories pc
                JOIN catalog_categories c ON c.id = pc.category_id
                WHERE pc.product_id = p.id AND c.status <> 'ACTIVE'
              )) AS eligible
       FROM catalog_product_variants v
       JOIN catalog_products p ON p.id = v.product_id
       JOIN catalog_brands b ON b.id = p.brand_id
       LEFT JOIN inventory_stocks s ON s.variant_id = v.id
      WHERE v.id = $1`,
    [variantId],
  )
  const variant = result.rows[0]
  if (!variant) throw new CartError('Variant not found.', 'NOT_FOUND')
  if (!variant.eligible) {
    throw new CartError('Variant is not commercially available.', 'UNAVAILABLE')
  }
  return variant
}

export class PostgresCartRepository implements CartRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async getOrCreate(customerId: string): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartId = await createOrLockCart(client, customerId)
      return loadCart(client, cartId, customerId)
    })
  }

  async addItem(
    customerId: string,
    variantId: string,
    quantity: number,
  ): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartId = await createOrLockCart(client, customerId)
      const variant = await readEligibleVariant(client, variantId)
      const existingResult = await client.query<{
        id: string
        quantity: string
      }>(
        `SELECT id, quantity::text AS quantity FROM cart_items
          WHERE cart_id = $1 AND variant_id = $2 FOR UPDATE`,
        [cartId, variantId],
      )
      const existing = existingResult.rows[0]
      const newQuantity =
        safeNumber(existing?.quantity ?? '0', 'cart quantity') + quantity
      if (!Number.isSafeInteger(newQuantity)) {
        throw new CartError(
          'Cart quantity exceeds the supported range.',
          'VALIDATION',
        )
      }
      if (
        newQuantity >
        safeNumber(variant.available_quantity, 'inventory balance')
      ) {
        throw new CartError(
          'Insufficient inventory for requested quantity.',
          'INSUFFICIENT_STOCK',
        )
      }
      calculateItemSubtotal(
        safeNumber(variant.price_cents, 'variant price'),
        newQuantity,
      )
      await client.query(
        `INSERT INTO cart_items (id, cart_id, variant_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cart_id, variant_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                       updated_at = now()`,
        [existing?.id ?? randomUUID(), cartId, variantId, quantity],
      )
      await client.query('UPDATE carts SET updated_at = now() WHERE id = $1', [
        cartId,
      ])
      return loadCart(client, cartId, customerId)
    })
  }

  async updateItem(
    customerId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartResult = await client.query<{ id: string }>(
        "SELECT id FROM carts WHERE customer_id = $1 AND status = 'ACTIVE' FOR UPDATE",
        [customerId],
      )
      const cartId = cartResult.rows[0]?.id
      if (!cartId) throw new CartError('Cart item not found.', 'NOT_FOUND')
      const result = await client.query<{
        id: string
        variant_id: string
        quantity: string
      }>(
        `SELECT id, variant_id, quantity::text AS quantity FROM cart_items
          WHERE id = $1 AND cart_id = $2 FOR UPDATE`,
        [itemId, cartId],
      )
      const item = result.rows[0]
      if (!item) throw new CartError('Cart item not found.', 'NOT_FOUND')
      const currentQuantity = safeNumber(item.quantity, 'cart quantity')
      if (quantity > currentQuantity) {
        const variant = await readEligibleVariant(client, item.variant_id)
        if (
          quantity > safeNumber(variant.available_quantity, 'inventory balance')
        ) {
          throw new CartError(
            'Insufficient inventory for requested quantity.',
            'INSUFFICIENT_STOCK',
          )
        }
        calculateItemSubtotal(
          safeNumber(variant.price_cents, 'variant price'),
          quantity,
        )
      }
      await client.query(
        'UPDATE cart_items SET quantity = $2, updated_at = now() WHERE id = $1',
        [itemId, quantity],
      )
      await client.query('UPDATE carts SET updated_at = now() WHERE id = $1', [
        cartId,
      ])
      return loadCart(client, cartId, customerId)
    })
  }

  async removeItem(customerId: string, itemId: string): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartIdResult = await client.query<{ id: string }>(
        "SELECT id FROM carts WHERE customer_id = $1 AND status = 'ACTIVE' FOR UPDATE",
        [customerId],
      )
      const cartId = cartIdResult.rows[0]?.id
      if (!cartId) throw new CartError('Cart item not found.', 'NOT_FOUND')
      const deleted = await client.query(
        'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2',
        [itemId, cartId],
      )
      if (!deleted.rowCount)
        throw new CartError('Cart item not found.', 'NOT_FOUND')
      await client.query('UPDATE carts SET updated_at = now() WHERE id = $1', [
        cartId,
      ])
      return loadCart(client, cartId, customerId)
    })
  }

  async applyCoupon(customerId: string, code: string): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartId = await createOrLockCart(client, customerId)
      const cart = await loadCart(client, cartId, customerId)
      const couponIdResult = await client.query<{ id: string }>(
        'SELECT id FROM coupons WHERE code = $1',
        [code],
      )
      const couponId = couponIdResult.rows[0]?.id
      if (!couponId) {
        throw new PromotionError('Coupon was not found.', 'COUPON_NOT_FOUND')
      }
      const now = new Date()
      const coupon = await loadCouponSnapshot(client, couponId, customerId)
      if (!coupon) {
        throw new PromotionError('Coupon was not found.', 'COUPON_NOT_FOUND')
      }
      const error = couponError(coupon, cart.subtotalCents, now)
      if (error) throw error

      await client.query(
        'UPDATE carts SET applied_coupon_id = $2, updated_at = now() WHERE id = $1',
        [cartId, coupon.id],
      )
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: customerId,
          action: 'COUPON_APPLIED',
          resourceType: 'Cart',
          resourceId: cartId,
          result: 'SUCCESS',
          source: 'cart.coupon',
        }),
      )
      return loadCart(client, cartId, customerId)
    })
  }

  async removeCoupon(customerId: string): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartId = await createOrLockCart(client, customerId)
      const result = await client.query<{ applied_coupon_id: string | null }>(
        'SELECT applied_coupon_id FROM carts WHERE id = $1',
        [cartId],
      )
      if (result.rows[0]?.applied_coupon_id) {
        await client.query(
          'UPDATE carts SET applied_coupon_id = NULL, updated_at = now() WHERE id = $1',
          [cartId],
        )
        await insertAuditEvent(
          client,
          createAuditEvent({
            actorId: customerId,
            action: 'COUPON_REMOVED',
            resourceType: 'Cart',
            resourceId: cartId,
            result: 'SUCCESS',
            source: 'cart.coupon',
          }),
        )
      }
      return loadCart(client, cartId, customerId)
    })
  }
}
