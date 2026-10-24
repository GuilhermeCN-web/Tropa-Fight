import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import {
  POST as createVariantApi,
  GET as listVariantsApi,
} from '../../app/api/admin/products/[id]/variants/route'
import { PATCH as updateVariantApi } from '../../app/api/admin/variants/[id]/route'
import { GET as getPublicProductApi } from '../../app/api/products/[id]/route'

const databaseConfigured = Boolean(process.env.DATABASE_URL)
const pool = getDatabasePool()

function request(
  path: string,
  method = 'GET',
  body?: unknown,
  cookie?: string,
) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

describe.skipIf(!databaseConfigured)(
  'product variant PostgreSQL integration',
  () => {
    const actorId = randomUUID()
    const customerId = randomUUID()
    const categoryId = randomUUID()
    const brandId = randomUUID()
    const productId = randomUUID()
    const secondProductId = randomUUID()
    let actorToken: string | undefined
    let customerToken: string | undefined

    afterAll(async () => {
      if (actorToken) await revokeSession(actorToken)
      if (customerToken) await revokeSession(customerToken)
      if (databaseConfigured) {
        await pool.query(
          'DELETE FROM catalog_product_variants WHERE product_id = ANY($1::uuid[])',
          [[productId, secondProductId]],
        )
        await pool.query(
          'DELETE FROM catalog_products WHERE id = ANY($1::uuid[])',
          [[productId, secondProductId]],
        )
        await pool.query('DELETE FROM catalog_categories WHERE id = $1', [
          categoryId,
        ])
        await pool.query('DELETE FROM catalog_brands WHERE id = $1', [brandId])
        await pool.query(
          'DELETE FROM identity_users WHERE id = ANY($1::uuid[])',
          [[actorId, customerId]],
        )
        await pool.end()
      }
    })

    it('enforces variant validation, uniqueness, RBAC, publication, archiving and audit', async () => {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(
          `INSERT INTO identity_users (id, email, password_hash, account_type, status)
         VALUES ($1, $2, 'integration-test-hash', 'ADMIN', 'ACTIVE'),
                ($3, $4, 'integration-test-hash', 'CUSTOMER', 'ACTIVE')`,
          [
            actorId,
            `variant-admin-${actorId}@example.test`,
            customerId,
            `variant-customer-${customerId}@example.test`,
          ],
        )
        await client.query(
          `INSERT INTO identity_user_roles (user_id, role_code)
         VALUES ($1, 'CATALOG_MANAGER'), ($2, 'CUSTOMER')`,
          [actorId, customerId],
        )
        await client.query(
          'INSERT INTO catalog_categories (id, name) VALUES ($1, $2)',
          [categoryId, `Variant Category ${categoryId.slice(0, 8)}`],
        )
        await client.query(
          'INSERT INTO catalog_brands (id, name) VALUES ($1, $2)',
          [brandId, `Variant Brand ${brandId.slice(0, 8)}`],
        )
        for (const [id, name] of [
          [productId, 'Variant Test Product'],
          [secondProductId, 'Second Variant Test Product'],
        ]) {
          await client.query(
            'INSERT INTO catalog_products (id, name, brand_id) VALUES ($1, $2, $3)',
            [id, name, brandId],
          )
          await client.query(
            'INSERT INTO catalog_product_categories (product_id, category_id) VALUES ($1, $2)',
            [id, categoryId],
          )
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

      actorToken = await createSession(actorId)
      customerToken = await createSession(customerId)
      const actorCookie = `tropa_session=${actorToken}`
      const customerCookie = `tropa_session=${customerToken}`
      const routeContext = { params: Promise.resolve({ id: productId }) }
      const input = {
        sku: '  TF-GLOVE-M  ',
        attributes: { size: 'M', color: 'Black' },
        priceCents: 10990,
        status: 'ACTIVE',
      }

      expect(
        (
          await createVariantApi(
            request(`/api/admin/products/${productId}/variants`, 'POST', input),
            routeContext,
          )
        ).status,
      ).toBe(401)
      expect(
        (
          await listVariantsApi(
            request(
              `/api/admin/products/${productId}/variants`,
              'GET',
              undefined,
              customerCookie,
            ),
            routeContext,
          )
        ).status,
      ).toBe(403)

      const created = await createVariantApi(
        request(
          `/api/admin/products/${productId}/variants`,
          'POST',
          input,
          actorCookie,
        ),
        routeContext,
      )
      expect(created.status).toBe(201)
      const { variant } = await created.json()
      expect(variant).toMatchObject({
        productId,
        sku: '  TF-GLOVE-M  ',
        attributes: { size: 'M', color: 'Black' },
        priceCents: 10990,
        currency: 'BRL',
        status: 'ACTIVE',
      })

      const adminList = await listVariantsApi(
        request(
          `/api/admin/products/${productId}/variants`,
          'GET',
          undefined,
          actorCookie,
        ),
        routeContext,
      )
      expect((await adminList.json()).variants).toHaveLength(1)

      const concurrentCreates = await Promise.all(
        ['TF-GLOVE-RED-1', 'TF-GLOVE-RED-2'].map((sku) =>
          createVariantApi(
            request(
              `/api/admin/products/${productId}/variants`,
              'POST',
              {
                ...input,
                sku,
                attributes: { size: 'M', color: 'Red' },
                status: 'INACTIVE',
              },
              actorCookie,
            ),
            routeContext,
          ),
        ),
      )
      expect(
        concurrentCreates.map((response) => response.status).sort(),
      ).toEqual([201, 409])

      const duplicateGlobalSku = await createVariantApi(
        request(
          `/api/admin/products/${secondProductId}/variants`,
          'POST',
          {
            ...input,
            sku: 'tf-glove-m',
            attributes: {},
          },
          actorCookie,
        ),
        { params: Promise.resolve({ id: secondProductId }) },
      )
      expect(duplicateGlobalSku.status).toBe(409)

      const emptyAttributesVariant = await createVariantApi(
        request(
          `/api/admin/products/${secondProductId}/variants`,
          'POST',
          { ...input, sku: 'TF-ONE-SIZE', attributes: {} },
          actorCookie,
        ),
        { params: Promise.resolve({ id: secondProductId }) },
      )
      expect(emptyAttributesVariant.status).toBe(201)
      const duplicateEmptyAttributes = await createVariantApi(
        request(
          `/api/admin/products/${secondProductId}/variants`,
          'POST',
          { ...input, sku: 'TF-ONE-SIZE-2', attributes: {} },
          actorCookie,
        ),
        { params: Promise.resolve({ id: secondProductId }) },
      )
      expect(duplicateEmptyAttributes.status).toBe(409)

      const duplicateAttributes = await createVariantApi(
        request(
          `/api/admin/products/${productId}/variants`,
          'POST',
          {
            ...input,
            sku: 'TF-GLOVE-M-2',
            attributes: { color: 'Black', size: 'M' },
          },
          actorCookie,
        ),
        routeContext,
      )
      expect(duplicateAttributes.status).toBe(409)

      const invalidPrice = await createVariantApi(
        request(
          `/api/admin/products/${productId}/variants`,
          'POST',
          { ...input, sku: 'TF-GLOVE-M-3', priceCents: 109.9 },
          actorCookie,
        ),
        routeContext,
      )
      expect(invalidPrice.status).toBe(400)
      await expect(
        pool.query(
          `INSERT INTO catalog_product_variants
           (id, product_id, sku, attributes, price_cents, status)
         VALUES ($1, $2, $3, $4::jsonb, 1, 'ACTIVE')`,
          [
            randomUUID(),
            productId,
            `TF-INVALID-ATTR-${randomUUID()}`,
            JSON.stringify({ size: 7 }),
          ],
        ),
      ).rejects.toThrow()

      const published = await pool.query(
        "UPDATE catalog_products SET publication_state = 'PUBLISHED' WHERE id = $1",
        [productId],
      )
      expect(published.rowCount).toBe(1)
      const publicProduct = await getPublicProductApi(
        request(`/api/products/${productId}`),
        { params: Promise.resolve({ id: productId }) },
      )
      expect(publicProduct.status).toBe(200)
      const publicBody = await publicProduct.json()
      expect(publicBody.variants).toHaveLength(1)
      expect(publicBody.variants[0]).toMatchObject({
        attributes: { size: 'M', color: 'Black' },
        priceCents: 10990,
        currency: 'BRL',
        status: 'ACTIVE',
        commerciallyAvailable: true,
      })
      expect(JSON.stringify(publicBody)).not.toContain('sku')

      const repriced = await updateVariantApi(
        request(
          `/api/admin/variants/${variant.id}`,
          'PATCH',
          { priceCents: 11990 },
          actorCookie,
        ),
        { params: Promise.resolve({ id: variant.id }) },
      )
      expect(repriced.status).toBe(200)
      expect((await repriced.json()).variant.priceCents).toBe(11990)

      const deactivated = await updateVariantApi(
        request(
          `/api/admin/variants/${variant.id}`,
          'PATCH',
          { status: 'INACTIVE' },
          actorCookie,
        ),
        { params: Promise.resolve({ id: variant.id }) },
      )
      expect(deactivated.status).toBe(200)
      const publicAfterDeactivation = await getPublicProductApi(
        request(`/api/products/${productId}`),
        { params: Promise.resolve({ id: productId }) },
      )
      expect((await publicAfterDeactivation.json()).variants).toEqual([])

      await pool.query(
        "UPDATE catalog_products SET publication_state = 'ARCHIVED' WHERE id = $1",
        [productId],
      )
      const archivedCreate = await createVariantApi(
        request(
          `/api/admin/products/${productId}/variants`,
          'POST',
          { ...input, sku: 'TF-ARCHIVED' },
          actorCookie,
        ),
        routeContext,
      )
      expect(archivedCreate.status).toBe(409)
      const archivedUpdate = await updateVariantApi(
        request(
          `/api/admin/variants/${variant.id}`,
          'PATCH',
          { priceCents: 12000 },
          actorCookie,
        ),
        { params: Promise.resolve({ id: variant.id }) },
      )
      expect(archivedUpdate.status).toBe(409)
      const unchangedVariant = await pool.query<{
        status: string
        price_cents: string
      }>(
        'SELECT status, price_cents::text FROM catalog_product_variants WHERE id = $1',
        [variant.id],
      )
      expect(unchangedVariant.rows[0]).toMatchObject({
        status: 'INACTIVE',
        price_cents: '11990',
      })

      const audit = await pool.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM audit_logs
        WHERE actor_id = $1 AND resource_id = $2
          AND action IN (
            'PRODUCT_VARIANT_CREATED',
            'PRODUCT_VARIANT_PRICE_CHANGED',
            'PRODUCT_VARIANT_AVAILABILITY_CHANGED'
          )`,
        [actorId, variant.id],
      )
      expect(Number(audit.rows[0]?.count)).toBe(3)
    })
  },
)
