import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import { CatalogError, type ProductPublicationState } from '../domain/catalog'
import type {
  ProductVariant,
  ProductVariantAttributes,
  ProductVariantStatus,
  PublicProductVariant,
} from '../domain/product-variant'
import type {
  ProductVariantInput,
  ProductVariantRepository,
  ProductVariantUpdate,
} from '../application/product-variant-repository'

type ProductVariantRow = {
  id: string
  product_id: string
  sku: string
  attributes: ProductVariantAttributes
  price_cents: string
  currency: 'BRL'
  status: ProductVariantStatus
  created_at: Date
  updated_at: Date
}

function toVariant(row: ProductVariantRow): ProductVariant {
  const priceCents = Number(row.price_cents)
  if (!Number.isSafeInteger(priceCents)) {
    throw new Error('Stored variant price exceeds the supported safe integer.')
  }
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    attributes: row.attributes,
    priceCents,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
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

function recordVariantAudit(
  client: PoolClient,
  actorId: string,
  action:
    | 'PRODUCT_VARIANT_CREATED'
    | 'PRODUCT_VARIANT_UPDATED'
    | 'PRODUCT_VARIANT_PRICE_CHANGED'
    | 'PRODUCT_VARIANT_AVAILABILITY_CHANGED',
  variantId: string,
) {
  return insertAuditEvent(
    client,
    createAuditEvent({
      actorId,
      action,
      resourceType: 'ProductVariant',
      resourceId: variantId,
      result: 'SUCCESS',
      source: 'catalog.productvariant',
    }),
  )
}

async function lockEditableProduct(
  client: PoolClient,
  productId: string,
): Promise<ProductPublicationState> {
  const result = await client.query<{
    publication_state: ProductPublicationState
  }>(
    'SELECT publication_state FROM catalog_products WHERE id = $1 FOR UPDATE',
    [productId],
  )
  const state = result.rows[0]?.publication_state
  if (!state) throw new CatalogError('Product not found.', 'NOT_FOUND')
  if (state === 'ARCHIVED') {
    throw new CatalogError(
      'Variants of archived products cannot be changed.',
      'INVALID_TRANSITION',
    )
  }
  return state
}

function translateDatabaseError(error: unknown): never {
  const databaseError = error as { code?: string; constraint?: string }
  if (databaseError.code === '23505') {
    throw new CatalogError(
      databaseError.constraint?.includes('sku')
        ? 'SKU is already in use.'
        : 'A variant with these attributes already exists for this product.',
      'CONFLICT',
    )
  }
  if (databaseError.code === '23503') {
    throw new CatalogError('Product not found.', 'NOT_FOUND')
  }
  throw error
}

const columns = `id, product_id, sku, attributes, price_cents::text AS price_cents,
                 currency, status, created_at, updated_at`
const publicColumns = `v.id, v.product_id, v.sku, v.attributes,
                       v.price_cents::text AS price_cents, v.currency,
                       v.status, v.created_at, v.updated_at`

export class PostgresProductVariantRepository implements ProductVariantRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async create(productId: string, input: ProductVariantInput, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      await lockEditableProduct(client, productId)
      try {
        const result = await client.query<ProductVariantRow>(
          `INSERT INTO catalog_product_variants
             (id, product_id, sku, attributes, price_cents, status)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)
           RETURNING ${columns}`,
          [
            randomUUID(),
            productId,
            input.sku,
            JSON.stringify(input.attributes),
            input.priceCents,
            input.status,
          ],
        )
        const variant = toVariant(result.rows[0]!)
        await recordVariantAudit(
          client,
          actorId,
          'PRODUCT_VARIANT_CREATED',
          variant.id,
        )
        return variant
      } catch (error) {
        translateDatabaseError(error)
      }
    })
  }

  async listByProduct(productId: string) {
    const product = await this.pool.query(
      'SELECT id FROM catalog_products WHERE id = $1',
      [productId],
    )
    if (!product.rowCount)
      throw new CatalogError('Product not found.', 'NOT_FOUND')
    const result = await this.pool.query<ProductVariantRow>(
      `SELECT ${columns} FROM catalog_product_variants
        WHERE product_id = $1 ORDER BY created_at, id`,
      [productId],
    )
    return result.rows.map(toVariant)
  }

  async listPublicByProduct(
    productId: string,
  ): Promise<PublicProductVariant[]> {
    const result = await this.pool.query<ProductVariantRow>(
      `SELECT ${publicColumns}
         FROM catalog_product_variants v
         JOIN catalog_products p ON p.id = v.product_id
        WHERE v.product_id = $1
          AND p.publication_state = 'PUBLISHED'
          AND v.status = 'ACTIVE'
        ORDER BY v.created_at, v.id`,
      [productId],
    )
    return result.rows.map((row) => {
      const { sku: _sku, ...variant } = toVariant(row)
      return { ...variant, commerciallyAvailable: true }
    })
  }

  async getById(id: string) {
    const result = await this.pool.query<ProductVariantRow>(
      `SELECT ${columns} FROM catalog_product_variants WHERE id = $1`,
      [id],
    )
    return result.rows[0] ? toVariant(result.rows[0]) : null
  }

  async update(id: string, input: ProductVariantUpdate, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const currentResult = await client.query<ProductVariantRow>(
        `SELECT ${columns} FROM catalog_product_variants WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) throw new CatalogError('Variant not found.', 'NOT_FOUND')
      await lockEditableProduct(client, current.product_id)
      const updatedSku = input.sku ?? current.sku
      const updatedAttributes = input.attributes ?? current.attributes
      const updatedPrice = input.priceCents ?? Number(current.price_cents)
      const updatedStatus = input.status ?? current.status
      try {
        const result = await client.query<ProductVariantRow>(
          `UPDATE catalog_product_variants
              SET sku = $2, attributes = $3::jsonb, price_cents = $4,
                  status = $5, updated_at = now()
            WHERE id = $1
            RETURNING ${columns}`,
          [
            id,
            updatedSku,
            JSON.stringify(updatedAttributes),
            updatedPrice,
            updatedStatus,
          ],
        )
        const variant = toVariant(result.rows[0]!)
        if (updatedPrice !== Number(current.price_cents)) {
          await recordVariantAudit(
            client,
            actorId,
            'PRODUCT_VARIANT_PRICE_CHANGED',
            id,
          )
        }
        if (updatedStatus !== current.status) {
          await recordVariantAudit(
            client,
            actorId,
            'PRODUCT_VARIANT_AVAILABILITY_CHANGED',
            id,
          )
        }
        if (
          updatedSku !== current.sku ||
          JSON.stringify(updatedAttributes) !==
            JSON.stringify(current.attributes)
        ) {
          await recordVariantAudit(
            client,
            actorId,
            'PRODUCT_VARIANT_UPDATED',
            id,
          )
        }
        return variant
      } catch (error) {
        translateDatabaseError(error)
      }
    })
  }
}
