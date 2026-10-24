import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import { GET as searchProductsApi } from '../../app/api/products/route'

const databaseConfigured = Boolean(process.env.DATABASE_URL)
const pool = getDatabasePool()

function request(path: string): Request {
  return new Request(`http://localhost${path}`)
}

describe.skipIf(!databaseConfigured)(
  'catalog search PostgreSQL integration',
  () => {
    const categoryId = randomUUID()
    const brandId = randomUUID()
    const productIds = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ]
    const variantIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]
    const marker = `Search ${randomUUID().slice(0, 8)}`

    afterAll(async () => {
      if (databaseConfigured) {
        await pool.query(
          'DELETE FROM catalog_product_variants WHERE id = ANY($1::uuid[])',
          [variantIds],
        )
        await pool.query(
          'DELETE FROM catalog_products WHERE id = ANY($1::uuid[])',
          [productIds],
        )
        await pool.query('DELETE FROM catalog_categories WHERE id = $1', [
          categoryId,
        ])
        await pool.query('DELETE FROM catalog_brands WHERE id = $1', [brandId])
        await pool.end()
      }
    })

    it('searches, combines filters, sorts by price and paginates only public products', async () => {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(
          'INSERT INTO catalog_categories (id, name) VALUES ($1, $2)',
          [categoryId, `${marker} Category`],
        )
        await client.query(
          'INSERT INTO catalog_brands (id, name) VALUES ($1, $2)',
          [brandId, `${marker} Brand`],
        )

        const products = [
          {
            id: productIds[0]!,
            name: `${marker} Red MMA Gloves`,
            state: 'PUBLISHED',
          },
          {
            id: productIds[1]!,
            name: `${marker} Blue Boxing Wraps`,
            state: 'PUBLISHED',
          },
          {
            id: productIds[2]!,
            name: `${marker} Red MMA Gloves`,
            state: 'PUBLISHED',
          },
          {
            id: productIds[3]!,
            name: `${marker} Draft Gloves`,
            state: 'DRAFT',
          },
          {
            id: productIds[4]!,
            name: `${marker} Unpriced Published Product`,
            state: 'PUBLISHED',
          },
        ]
        for (const product of products) {
          await client.query(
            `INSERT INTO catalog_products (id, name, description, brand_id, publication_state)
           VALUES ($1, $2, 'Training equipment', $3, $4)`,
            [product.id, product.name, brandId, product.state],
          )
          await client.query(
            'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
            [product.id, categoryId],
          )
        }
        const variants = [
          [variantIds[0]!, productIds[0]!, 'M', 7500],
          [variantIds[1]!, productIds[0]!, 'L', 12000],
          [variantIds[2]!, productIds[1]!, '', 4500],
          [variantIds[3]!, productIds[2]!, '', 7500],
        ]
        for (const [id, productId, size, priceCents] of variants) {
          await client.query(
            `INSERT INTO catalog_product_variants
             (id, product_id, sku, attributes, price_cents, status)
           VALUES ($1, $2, $3, $4::jsonb, $5, 'ACTIVE')`,
            [
              id,
              productId,
              `SEARCH-${id}`,
              JSON.stringify(size ? { size } : {}),
              priceCents,
            ],
          )
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

      const all = await searchProductsApi(
        request(
          `/api/products?q=${encodeURIComponent(marker.toLowerCase())}&pageSize=10`,
        ),
      )
      expect(all.status).toBe(200)
      const allResult = await all.json()
      expect(allResult.items).toHaveLength(3)
      expect(
        allResult.items.map((item: { id: string }) => item.id),
      ).not.toContain(productIds[3])
      expect(
        allResult.items.map((item: { id: string }) => item.id),
      ).not.toContain(productIds[4])

      const descriptionSearch = await searchProductsApi(
        request('/api/products?q=training%20equipment&pageSize=10'),
      )
      expect((await descriptionSearch.json()).items).toHaveLength(3)

      const categorySearch = await searchProductsApi(
        request(
          `/api/products?q=${encodeURIComponent(`${marker} Category`)}&pageSize=10`,
        ),
      )
      expect((await categorySearch.json()).items).toHaveLength(3)

      const matchingVariantPrice = await searchProductsApi(
        request(
          `/api/products?categoryId=${categoryId}&brandId=${brandId}&minPriceCents=12000&maxPriceCents=12000&q=${encodeURIComponent('red mma')}`,
        ),
      )
      const matchingVariantResult = await matchingVariantPrice.json()
      expect(matchingVariantPrice.status).toBe(200)
      expect(
        matchingVariantResult.items.map((item: { id: string }) => item.id),
      ).toEqual([productIds[0]])
      expect(matchingVariantResult.items[0].priceCents).toBe(7500)

      const priceSorted = await searchProductsApi(
        request(
          `/api/products?q=${encodeURIComponent(marker)}&sort=price_asc&pageSize=10`,
        ),
      )
      const priceSortedResult = await priceSorted.json()
      expect(
        priceSortedResult.items.map((item: { id: string }) => item.id),
      ).toEqual([productIds[1], ...[productIds[0]!, productIds[2]!].sort()])

      const defaultSort = await searchProductsApi(
        request(`/api/products?q=${encodeURIComponent(marker)}&pageSize=10`),
      )
      const defaultSortResult = await defaultSort.json()
      expect(
        defaultSortResult.items.map((item: { id: string }) => item.id),
      ).toEqual([productIds[1], ...[productIds[0]!, productIds[2]!].sort()])

      const reverseNameSort = await searchProductsApi(
        request(
          `/api/products?q=${encodeURIComponent(marker)}&sort=name_desc&pageSize=10`,
        ),
      )
      const reverseNameSortResult = await reverseNameSort.json()
      expect(
        reverseNameSortResult.items.map((item: { id: string }) => item.id),
      ).toEqual([...[productIds[0]!, productIds[2]!].sort(), productIds[1]])

      const lastPage = await searchProductsApi(
        request(
          `/api/products?q=${encodeURIComponent(marker)}&page=2&pageSize=2`,
        ),
      )
      expect((await lastPage.json()).items).toHaveLength(1)

      const outsideRange = await searchProductsApi(
        request(
          `/api/products?q=${encodeURIComponent(marker)}&page=4&pageSize=1`,
        ),
      )
      const outsideRangeResult = await outsideRange.json()
      expect(outsideRangeResult).toMatchObject({
        items: [],
        pagination: { page: 4, pageSize: 1, totalItems: 3, totalPages: 3 },
      })

      const emptySearch = await searchProductsApi(
        request(`/api/products?q=${encodeURIComponent(`missing-${marker}`)}`),
      )
      expect(await emptySearch.json()).toMatchObject({
        items: [],
        pagination: { totalItems: 0, totalPages: 0 },
      })

      const injectionLikeSearch = await searchProductsApi(
        request('/api/products?q=%25%27%20OR%201%3D1%20--'),
      )
      expect((await injectionLikeSearch.json()).items).toEqual([])

      for (const invalidQuery of [
        'sort=created_at',
        'sort=price_asc%3BDROP%20TABLE%20catalog_products',
        'minPriceCents=500&maxPriceCents=100',
        'minPriceCents=-1',
        'page=0',
        'pageSize=101',
        'categoryId=invalid',
        'unknown=value',
      ]) {
        expect(
          (await searchProductsApi(request(`/api/products?${invalidQuery}`)))
            .status,
        ).toBe(400)
      }
    })
  },
)
