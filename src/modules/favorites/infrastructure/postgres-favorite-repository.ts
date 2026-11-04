import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { FavoriteError, type Favorite } from '../domain/favorite'
import type { FavoriteRepository } from '../application/favorite-repository'

type FavoriteRow = {
  id: string
  customer_id: string
  product_id: string
  product_name: string
  publication_state: Favorite['productPublicationState']
  created_at: Date | string
}

function mapFavorite(row: FavoriteRow): Favorite {
  return {
    id: row.id,
    customerId: row.customer_id,
    productId: row.product_id,
    productName: row.product_name,
    productPublicationState: row.publication_state,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export class PostgresFavoriteRepository implements FavoriteRepository {
  private readonly configuredPool?: Pool

  constructor(configuredPool?: Pool) {
    this.configuredPool = configuredPool
  }

  private get pool(): Pool {
    return this.configuredPool ?? getDatabasePool()
  }

  async add(customerId: string, productId: string): Promise<Favorite> {
    const product = await this.pool.query(
      'SELECT id FROM catalog_products WHERE id=$1',
      [productId],
    )
    if (!product.rows[0])
      throw new FavoriteError('Product not found.', 'NOT_FOUND')

    await this.pool.query(
      `INSERT INTO customer_favorites(id,customer_id,product_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (customer_id,product_id) DO NOTHING
       RETURNING id`,
      [randomUUID(), customerId, productId],
    )
    const row = await this.findFavorite(customerId, productId)
    if (!row) throw new Error('Favorite could not be loaded after insertion.')
    return row
  }

  async remove(customerId: string, productId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM customer_favorites WHERE customer_id=$1 AND product_id=$2',
      [customerId, productId],
    )
  }

  async listForCustomer(customerId: string): Promise<Favorite[]> {
    const result = await this.pool.query<FavoriteRow>(
      `SELECT f.id,f.customer_id,f.product_id,p.name AS product_name,
              p.publication_state,f.created_at
         FROM customer_favorites f
         JOIN catalog_products p ON p.id=f.product_id
        WHERE f.customer_id=$1
        ORDER BY f.created_at DESC,f.id DESC`,
      [customerId],
    )
    return result.rows.map(mapFavorite)
  }

  private async findFavorite(customerId: string, productId: string) {
    const result = await this.pool.query<FavoriteRow>(
      `SELECT f.id,f.customer_id,f.product_id,p.name AS product_name,
              p.publication_state,f.created_at
         FROM customer_favorites f
         JOIN catalog_products p ON p.id=f.product_id
        WHERE f.customer_id=$1 AND f.product_id=$2`,
      [customerId, productId],
    )
    return result.rows[0] ? mapFavorite(result.rows[0]) : null
  }
}
