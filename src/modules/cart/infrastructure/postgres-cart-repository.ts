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

type CartRow = {
  id: string
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
         COALESCE(s.quantity, 0)::text AS available_quantity,
         ci.created_at, ci.updated_at
    FROM cart_items ci
    JOIN catalog_product_variants v ON v.id = ci.variant_id
    JOIN catalog_products p ON p.id = v.product_id
    LEFT JOIN inventory_stocks s ON s.variant_id = v.id
   WHERE ci.cart_id = $1
   ORDER BY ci.created_at, ci.id`

async function loadCart(client: PoolClient, cartId: string): Promise<Cart> {
  const cartResult = await client.query<CartRow>(
    'SELECT id, created_at, updated_at FROM carts WHERE id = $1',
    [cartId],
  )
  const cart = cartResult.rows[0]
  if (!cart) throw new CartError('Cart not found.', 'NOT_FOUND')
  const itemResult = await client.query<CartItemRow>(cartItemsQuery, [cartId])
  const items = itemResult.rows.map(toCartItem)
  return {
    id: cart.id,
    items,
    ...calculateCartTotals(items),
    createdAt: cart.created_at.toISOString(),
    updatedAt: cart.updated_at.toISOString(),
  }
}

async function createOrLockCart(
  client: PoolClient,
  customerId: string,
): Promise<string> {
  await client.query(
    `INSERT INTO carts (id, customer_id) VALUES ($1, $2)
     ON CONFLICT (customer_id) DO NOTHING`,
    [randomUUID(), customerId],
  )
  const result = await client.query<CartRow>(
    'SELECT id, created_at, updated_at FROM carts WHERE customer_id = $1 FOR UPDATE',
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
            COALESCE(s.quantity, 0)::text AS available_quantity,
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
      return loadCart(client, cartId)
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
      return loadCart(client, cartId)
    })
  }

  async updateItem(
    customerId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartResult = await client.query<{ id: string }>(
        'SELECT id FROM carts WHERE customer_id = $1 FOR UPDATE',
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
      return loadCart(client, cartId)
    })
  }

  async removeItem(customerId: string, itemId: string): Promise<Cart> {
    return inTransaction(this.pool, async (client) => {
      const cartIdResult = await client.query<{ id: string }>(
        'SELECT id FROM carts WHERE customer_id = $1 FOR UPDATE',
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
      return loadCart(client, cartId)
    })
  }
}
