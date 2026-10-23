import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import { CatalogError } from '../domain/catalog'
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogEntityStatus,
  CatalogProduct,
  ProductPublicationState,
} from '../domain/catalog'
import type {
  CatalogSearchProduct,
  CatalogSearchQuery,
  CatalogSearchResult,
} from '../domain/catalog-search'
import type {
  CatalogRepository,
  EntityInput,
  EntityUpdate,
  ProductInput,
  ProductUpdate,
} from '../application/catalog-repository'

type EntityRow = {
  id: string
  name: string
  status: CatalogEntityStatus
  created_at: Date
  updated_at: Date
}

type ProductRow = {
  id: string
  name: string
  description: string | null
  brand_id: string
  brand_name: string
  categories: Array<{ id: string; name: string }>
  publication_state: ProductPublicationState
  created_at: Date
  updated_at: Date
}

type CatalogSearchRow = {
  id: string
  name: string
  description: string | null
  brand_id: string
  brand_name: string
  categories: Array<{ id: string; name: string }>
  price_cents: string
}

function searchSortSql(sort: CatalogSearchQuery['sort']): string {
  switch (sort) {
    case 'name_asc':
      return 'lower(p.name) ASC, p.id ASC'
    case 'name_desc':
      return 'lower(p.name) DESC, p.id ASC'
    case 'price_asc':
      return 'variant_price.price_cents ASC, p.id ASC'
    case 'price_desc':
      return 'variant_price.price_cents DESC, p.id ASC'
  }
}

function escapeLike(value: string): string {
  return value.replace(/[!%_]/g, (character) => `!${character}`)
}

function toCatalogSearchProduct(row: CatalogSearchRow): CatalogSearchProduct {
  const priceCents = Number(row.price_cents)
  if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
    throw new Error('Catalog variant price is outside the safe integer range.')
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    brand: { id: row.brand_id, name: row.brand_name },
    categories: row.categories,
    priceCents,
  }
}

function toCategory(row: EntityRow): CatalogCategory {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function toBrand(row: EntityRow): CatalogBrand {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function toProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    brand: { id: row.brand_id, name: row.brand_name },
    categories: row.categories,
    publicationState: row.publication_state,
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

async function insertAudit(
  client: PoolClient,
  actorId: string,
  action: Parameters<typeof createAuditEvent>[0]['action'],
  resourceType: string,
  resourceId: string,
): Promise<void> {
  await insertAuditEvent(
    client,
    createAuditEvent({
      actorId,
      action,
      resourceType,
      resourceId,
      result: 'SUCCESS',
      source: `catalog.${resourceType.toLowerCase()}`,
    }),
  )
}

async function findEntityById(
  client: PoolClient,
  table: 'catalog_categories' | 'catalog_brands',
  id: string,
  lock = false,
): Promise<EntityRow | null> {
  const result = await client.query<EntityRow>(
    `SELECT id, name, status, created_at, updated_at FROM ${table} WHERE id = $1${lock ? ' FOR UPDATE' : ''}`,
    [id],
  )
  return result.rows[0] ?? null
}

async function ensureActiveBrand(
  client: PoolClient,
  id: string,
): Promise<void> {
  const result = await client.query(
    "SELECT id FROM catalog_brands WHERE id = $1 AND status = 'ACTIVE' FOR SHARE",
    [id],
  )
  if (!result.rowCount)
    throw new CatalogError('Brand does not exist or is inactive.', 'REFERENCE')
}

async function ensureActiveCategories(
  client: PoolClient,
  ids: string[],
): Promise<void> {
  const result = await client.query(
    "SELECT id FROM catalog_categories WHERE id = ANY($1::uuid[]) AND status = 'ACTIVE' FOR SHARE",
    [ids],
  )
  if (result.rowCount !== ids.length) {
    throw new CatalogError(
      'One or more categories do not exist or are inactive.',
      'REFERENCE',
    )
  }
}

const productSelect = `
  SELECT p.id, p.name, p.description, p.brand_id, b.name AS brand_name,
         p.publication_state, p.created_at, p.updated_at,
         COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name)
           ORDER BY c.name, c.id) FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS categories
    FROM catalog_products p
    JOIN catalog_brands b ON b.id = p.brand_id
    LEFT JOIN catalog_product_categories pc ON pc.product_id = p.id
    LEFT JOIN catalog_categories c ON c.id = pc.category_id`

const productGroup = ' GROUP BY p.id, b.id'
const publicEligibility = `
    p.publication_state = 'PUBLISHED'
    AND b.status = 'ACTIVE'
    AND EXISTS (SELECT 1 FROM catalog_product_categories required_pc WHERE required_pc.product_id = p.id)
    AND NOT EXISTS (
      SELECT 1 FROM catalog_product_categories hidden_pc
      JOIN catalog_categories hidden_c ON hidden_c.id = hidden_pc.category_id
      WHERE hidden_pc.product_id = p.id AND hidden_c.status <> 'ACTIVE'
    )`

export class PostgresCatalogRepository implements CatalogRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async createCategory(input: EntityInput, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const result = await client.query<EntityRow>(
        `INSERT INTO catalog_categories (id, name) VALUES ($1, $2)
         RETURNING id, name, status, created_at, updated_at`,
        [randomUUID(), input.name],
      )
      const row = result.rows[0]!
      await insertAudit(client, actorId, 'CATEGORY_CREATED', 'Category', row.id)
      return toCategory(row)
    })
  }

  async updateCategory(id: string, input: EntityUpdate, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const current = await findEntityById(
        client,
        'catalog_categories',
        id,
        true,
      )
      if (!current) throw new CatalogError('Category not found.', 'NOT_FOUND')
      const result = await client.query<EntityRow>(
        `UPDATE catalog_categories
            SET name = $2, status = $3, updated_at = now()
          WHERE id = $1
          RETURNING id, name, status, created_at, updated_at`,
        [id, input.name ?? current.name, input.status ?? current.status],
      )
      await insertAudit(client, actorId, 'CATEGORY_UPDATED', 'Category', id)
      return toCategory(result.rows[0]!)
    })
  }

  async getCategory(id: string) {
    const result = await this.pool.query<EntityRow>(
      'SELECT id, name, status, created_at, updated_at FROM catalog_categories WHERE id = $1',
      [id],
    )
    return result.rows[0] ? toCategory(result.rows[0]) : null
  }

  async listCategories() {
    const result = await this.pool.query<EntityRow>(
      'SELECT id, name, status, created_at, updated_at FROM catalog_categories ORDER BY name, id',
    )
    return result.rows.map(toCategory)
  }

  async createBrand(input: EntityInput, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const result = await client.query<EntityRow>(
        `INSERT INTO catalog_brands (id, name) VALUES ($1, $2)
         RETURNING id, name, status, created_at, updated_at`,
        [randomUUID(), input.name],
      )
      const row = result.rows[0]!
      await insertAudit(client, actorId, 'BRAND_CREATED', 'Brand', row.id)
      return toBrand(row)
    })
  }

  async updateBrand(id: string, input: EntityUpdate, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const current = await findEntityById(client, 'catalog_brands', id, true)
      if (!current) throw new CatalogError('Brand not found.', 'NOT_FOUND')
      const result = await client.query<EntityRow>(
        `UPDATE catalog_brands
            SET name = $2, status = $3, updated_at = now()
          WHERE id = $1
          RETURNING id, name, status, created_at, updated_at`,
        [id, input.name ?? current.name, input.status ?? current.status],
      )
      await insertAudit(client, actorId, 'BRAND_UPDATED', 'Brand', id)
      return toBrand(result.rows[0]!)
    })
  }

  async getBrand(id: string) {
    const result = await this.pool.query<EntityRow>(
      'SELECT id, name, status, created_at, updated_at FROM catalog_brands WHERE id = $1',
      [id],
    )
    return result.rows[0] ? toBrand(result.rows[0]) : null
  }

  async listBrands() {
    const result = await this.pool.query<EntityRow>(
      'SELECT id, name, status, created_at, updated_at FROM catalog_brands ORDER BY name, id',
    )
    return result.rows.map(toBrand)
  }

  async createProduct(input: ProductInput, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      await ensureActiveBrand(client, input.brandId)
      await ensureActiveCategories(client, input.categoryIds)
      const id = randomUUID()
      await client.query(
        `INSERT INTO catalog_products (id, name, description, brand_id)
         VALUES ($1, $2, $3, $4)`,
        [id, input.name, input.description, input.brandId],
      )
      for (const categoryId of input.categoryIds) {
        await client.query(
          'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
          [id, categoryId],
        )
      }
      await insertAudit(client, actorId, 'PRODUCT_CREATED', 'Product', id)
      return this.requireProduct(client, id)
    })
  }

  async updateProduct(id: string, input: ProductUpdate, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const existing = await this.productById(client, id, true)
      if (!existing) throw new CatalogError('Product not found.', 'NOT_FOUND')
      const brandId = input.brandId ?? existing.brand.id
      const categoryIds =
        input.categoryIds ??
        existing.categories.map(({ id: categoryId }) => categoryId)
      if (input.brandId !== undefined) await ensureActiveBrand(client, brandId)
      if (input.categoryIds !== undefined)
        await ensureActiveCategories(client, categoryIds)
      await client.query(
        `UPDATE catalog_products
            SET name = $2, description = $3, brand_id = $4, updated_at = now()
          WHERE id = $1`,
        [
          id,
          input.name ?? existing.name,
          input.description === undefined
            ? existing.description
            : input.description,
          brandId,
        ],
      )
      if (input.categoryIds !== undefined) {
        await client.query(
          'DELETE FROM catalog_product_categories WHERE product_id = $1',
          [id],
        )
        for (const categoryId of categoryIds) {
          await client.query(
            'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
            [id, categoryId],
          )
        }
      }
      await insertAudit(client, actorId, 'PRODUCT_UPDATED', 'Product', id)
      return this.requireProduct(client, id)
    })
  }

  async publishProduct(id: string, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const existing = await this.productById(client, id, true)
      if (!existing) throw new CatalogError('Product not found.', 'NOT_FOUND')
      if (existing.publicationState !== 'DRAFT') {
        throw new CatalogError(
          'Only draft products can be published.',
          'INVALID_TRANSITION',
        )
      }
      await ensureActiveBrand(client, existing.brand.id)
      await ensureActiveCategories(
        client,
        existing.categories.map(({ id: categoryId }) => categoryId),
      )
      await client.query(
        "UPDATE catalog_products SET publication_state = 'PUBLISHED', updated_at = now() WHERE id = $1",
        [id],
      )
      await insertAudit(client, actorId, 'PRODUCT_PUBLISHED', 'Product', id)
      return this.requireProduct(client, id)
    })
  }

  async archiveProduct(id: string, actorId: string) {
    return inTransaction(this.pool, async (client) => {
      const existing = await this.productById(client, id, true)
      if (!existing) throw new CatalogError('Product not found.', 'NOT_FOUND')
      if (existing.publicationState === 'ARCHIVED') {
        throw new CatalogError(
          'Product is already archived.',
          'INVALID_TRANSITION',
        )
      }
      await client.query(
        "UPDATE catalog_products SET publication_state = 'ARCHIVED', updated_at = now() WHERE id = $1",
        [id],
      )
      await insertAudit(client, actorId, 'PRODUCT_ARCHIVED', 'Product', id)
      return this.requireProduct(client, id)
    })
  }

  async getProduct(id: string) {
    return this.productById(this.pool, id)
  }

  async listProducts() {
    const result = await this.pool.query<ProductRow>(
      `${productSelect}${productGroup} ORDER BY p.created_at DESC, p.id`,
    )
    return result.rows.map(toProduct)
  }

  async getPublicProduct(id: string) {
    const result = await this.pool.query<ProductRow>(
      `${productSelect} WHERE p.id = $1 AND ${publicEligibility}${productGroup}`,
      [id],
    )
    return result.rows[0] ? toProduct(result.rows[0]) : null
  }

  async listPublicProducts() {
    const result = await this.pool.query<ProductRow>(
      `${productSelect} WHERE ${publicEligibility}${productGroup} ORDER BY p.created_at DESC, p.id`,
    )
    return result.rows.map(toProduct)
  }

  async searchPublicProducts(
    query: CatalogSearchQuery,
  ): Promise<CatalogSearchResult> {
    const values: unknown[] = []
    const bind = (value: unknown) => {
      values.push(value)
      return `$${values.length}`
    }
    const conditions = [
      publicEligibility,
      'variant_price.price_cents IS NOT NULL',
    ]

    if (query.q) {
      const pattern = `%${escapeLike(query.q)}%`
      const searchParam = bind(pattern)
      conditions.push(`(
        p.name ILIKE ${searchParam} ESCAPE '!'
        OR COALESCE(p.description, '') ILIKE ${searchParam} ESCAPE '!'
        OR b.name ILIKE ${searchParam} ESCAPE '!'
        OR EXISTS (
          SELECT 1
            FROM catalog_product_categories search_pc
            JOIN catalog_categories search_c ON search_c.id = search_pc.category_id
           WHERE search_pc.product_id = p.id
             AND search_c.name ILIKE ${searchParam} ESCAPE '!'
        )
      )`)
    }

    if (query.categoryId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM catalog_product_categories filter_pc
         WHERE filter_pc.product_id = p.id AND filter_pc.category_id = ${bind(query.categoryId)}
      )`)
    }
    if (query.brandId) conditions.push(`b.id = ${bind(query.brandId)}`)

    if (
      query.minPriceCents !== undefined ||
      query.maxPriceCents !== undefined
    ) {
      const priceConditions = [
        'filter_v.product_id = p.id',
        "filter_v.status = 'ACTIVE'",
      ]
      if (query.minPriceCents !== undefined) {
        priceConditions.push(
          `filter_v.price_cents >= ${bind(query.minPriceCents)}`,
        )
      }
      if (query.maxPriceCents !== undefined) {
        priceConditions.push(
          `filter_v.price_cents <= ${bind(query.maxPriceCents)}`,
        )
      }
      conditions.push(`EXISTS (
        SELECT 1 FROM catalog_product_variants filter_v
         WHERE ${priceConditions.join(' AND ')}
      )`)
    }

    const from = `
      FROM catalog_products p
      JOIN catalog_brands b ON b.id = p.brand_id
      CROSS JOIN LATERAL (
        SELECT MIN(v.price_cents) AS price_cents
          FROM catalog_product_variants v
         WHERE v.product_id = p.id AND v.status = 'ACTIVE'
      ) variant_price
    `
    const where = `WHERE ${conditions.join(' AND ')}`

    const client = await this.pool.connect()
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const totalResult = await client.query<{ total_items: string }>(
        `SELECT COUNT(*)::text AS total_items${from}${where}`,
        values,
      )
      const totalItems = Number(totalResult.rows[0]?.total_items ?? 0)
      if (!Number.isSafeInteger(totalItems)) {
        throw new Error(
          'Catalog result count is outside the safe integer range.',
        )
      }
      const pageValues = [
        ...values,
        query.pageSize,
        (query.page - 1) * query.pageSize,
      ]
      const pageSizeParam = `$${pageValues.length - 1}`
      const offsetParam = `$${pageValues.length}`
      const itemsResult = await client.query<CatalogSearchRow>(
        `SELECT p.id, p.name, p.description, p.brand_id, b.name AS brand_name,
                variant_price.price_cents::text AS price_cents,
                COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name)
                  ORDER BY c.name, c.id) FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS categories
           ${from}
           LEFT JOIN catalog_product_categories pc ON pc.product_id = p.id
           LEFT JOIN catalog_categories c ON c.id = pc.category_id
           ${where}
          GROUP BY p.id, b.id, variant_price.price_cents
          ORDER BY ${searchSortSql(query.sort)}
          LIMIT ${pageSizeParam} OFFSET ${offsetParam}`,
        pageValues,
      )
      await client.query('COMMIT')
      return {
        items: itemsResult.rows.map(toCatalogSearchProduct),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / query.pageSize),
        },
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async productById(
    client: Pool | PoolClient,
    id: string,
    lock = false,
  ): Promise<CatalogProduct | null> {
    if (lock) {
      const locked = await client.query(
        'SELECT id FROM catalog_products WHERE id = $1 FOR UPDATE',
        [id],
      )
      if (!locked.rowCount) return null
    }
    const result = await client.query<ProductRow>(
      `${productSelect} WHERE p.id = $1${productGroup}`,
      [id],
    )
    return result.rows[0] ? toProduct(result.rows[0]) : null
  }

  private async requireProduct(
    client: Pool | PoolClient,
    id: string,
  ): Promise<CatalogProduct> {
    const product = await this.productById(client, id)
    if (!product)
      throw new Error('Catalog product missing after successful write.')
    return product
  }
}
