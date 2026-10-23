import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { POST as createCategoryApi } from '../../app/api/admin/categories/route'
import { PATCH as updateCategoryApi } from '../../app/api/admin/categories/[id]/route'
import { POST as createBrandApi } from '../../app/api/admin/brands/route'
import { PATCH as updateBrandApi } from '../../app/api/admin/brands/[id]/route'
import {
  POST as createProductApi,
  GET as listAdminProductsApi,
} from '../../app/api/admin/products/route'
import { POST as publishProductApi } from '../../app/api/admin/products/[id]/publish/route'
import { POST as archiveProductApi } from '../../app/api/admin/products/[id]/archive/route'
import { GET as listPublicProductsApi } from '../../app/api/products/route'
import { GET as getPublicProductApi } from '../../app/api/products/[id]/route'

const databaseConfigured = Boolean(process.env.DATABASE_URL)

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

describe.skipIf(!databaseConfigured)('catalog PostgreSQL integration', () => {
  const pool = getDatabasePool()
  const actorId = randomUUID()
  const email = `catalog-${actorId}@example.test`
  const customerId = randomUUID()
  let token: string | undefined
  let customerToken: string | undefined
  let productId: string | undefined
  let categoryId: string | undefined
  let brandId: string | undefined

  afterAll(async () => {
    if (token) await revokeSession(token)
    if (customerToken) await revokeSession(customerToken)
    if (databaseConfigured) {
      if (productId)
        await pool.query('DELETE FROM catalog_products WHERE id = $1', [
          productId,
        ])
      if (categoryId)
        await pool.query('DELETE FROM catalog_categories WHERE id = $1', [
          categoryId,
        ])
      if (brandId)
        await pool.query('DELETE FROM catalog_brands WHERE id = $1', [brandId])
      await pool.query(
        'DELETE FROM identity_users WHERE id = ANY($1::uuid[])',
        [[actorId, customerId]],
      )
      await pool.end()
    }
  })

  it('enforces RBAC, validation, publication visibility, relations and audit', async () => {
    await pool.query(
      `INSERT INTO identity_users (id, email, password_hash, account_type, status)
       VALUES ($1, $2, 'integration-test-hash', 'ADMIN', 'ACTIVE')`,
      [actorId, email],
    )
    await pool.query(
      "INSERT INTO identity_user_roles (user_id, role_code) VALUES ($1, 'CATALOG_MANAGER')",
      [actorId],
    )
    await pool.query(
      `INSERT INTO identity_users (id, email, password_hash, account_type, status)
       VALUES ($1, $2, 'integration-test-hash', 'CUSTOMER', 'ACTIVE')`,
      [customerId, `catalog-customer-${customerId}@example.test`],
    )
    await pool.query(
      "INSERT INTO identity_user_roles (user_id, role_code) VALUES ($1, 'CUSTOMER')",
      [customerId],
    )
    token = await createSession(actorId)
    customerToken = await createSession(customerId)
    const cookie = `tropa_session=${token}`

    expect(
      (
        await createCategoryApi(
          request('/api/admin/categories', 'POST', { name: 'Denied' }),
        )
      ).status,
    ).toBe(401)
    expect(
      (
        await createCategoryApi(
          request(
            '/api/admin/categories',
            'POST',
            { name: 'Denied' },
            `tropa_session=${customerToken}`,
          ),
        )
      ).status,
    ).toBe(403)

    const categoryResponse = await createCategoryApi(
      request('/api/admin/categories', 'POST', { name: '  Boxing  ' }, cookie),
    )
    expect(categoryResponse.status).toBe(201)
    const { category } = await categoryResponse.json()
    categoryId = category.id
    expect(category.name).toBe('Boxing')
    expect(category.status).toBe('ACTIVE')

    const brandResponse = await createBrandApi(
      request(
        '/api/admin/brands',
        'POST',
        { name: '  Example Brand  ' },
        cookie,
      ),
    )
    expect(brandResponse.status).toBe(201)
    const { brand } = await brandResponse.json()
    brandId = brand.id
    expect(brand.status).toBe('ACTIVE')

    await pool.query('BEGIN')
    await pool.query(
      `INSERT INTO catalog_products (id, name, brand_id)
       VALUES ($1, 'No category product', $2)`,
      [randomUUID(), brand.id],
    )
    await expect(pool.query('COMMIT')).rejects.toThrow(
      'Catalog products must have at least one category.',
    )
    await pool.query('ROLLBACK')

    expect(
      (
        await createCategoryApi(
          request(
            '/api/admin/categories',
            'POST',
            { name: 'x'.repeat(51) },
            cookie,
          ),
        )
      ).status,
    ).toBe(400)

    const invalidProduct = await createProductApi(
      request(
        '/api/admin/products',
        'POST',
        {
          name: 'Invalid relation',
          brandId: brand.id,
          categoryIds: [randomUUID()],
        },
        cookie,
      ),
    )
    expect(invalidProduct.status).toBe(400)

    const productResponse = await createProductApi(
      request(
        '/api/admin/products',
        'POST',
        {
          name: '  Training Gloves  ',
          description: '  Synthetic test  ',
          brandId: brand.id,
          categoryIds: [category.id],
        },
        cookie,
      ),
    )
    expect(productResponse.status).toBe(201)
    const { product } = await productResponse.json()
    productId = product.id
    expect(product).toMatchObject({
      name: 'Training Gloves',
      description: 'Synthetic test',
      brand: { id: brand.id },
      categories: [{ id: category.id }],
      publicationState: 'DRAFT',
    })

    expect((await listPublicProductsApi()).status).toBe(200)
    const draftList = await (await listPublicProductsApi()).json()
    expect(
      draftList.products.some((item: { id: string }) => item.id === product.id),
    ).toBe(false)
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(404)

    const published = await publishProductApi(
      request(
        `/api/admin/products/${product.id}/publish`,
        'POST',
        undefined,
        cookie,
      ),
      { params: Promise.resolve({ id: product.id }) },
    )
    expect(published.status).toBe(200)
    expect((await published.json()).product.publicationState).toBe('PUBLISHED')
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(200)

    const deactivated = await updateCategoryApi(
      request(
        `/api/admin/categories/${category.id}`,
        'PATCH',
        { status: 'INACTIVE' },
        cookie,
      ),
      { params: Promise.resolve({ id: category.id }) },
    )
    expect(deactivated.status).toBe(200)
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(404)

    const inactiveAssociation = await createProductApi(
      request(
        '/api/admin/products',
        'POST',
        {
          name: 'Blocked association',
          brandId: brand.id,
          categoryIds: [category.id],
        },
        cookie,
      ),
    )
    expect(inactiveAssociation.status).toBe(400)

    await updateCategoryApi(
      request(
        `/api/admin/categories/${category.id}`,
        'PATCH',
        { status: 'ACTIVE' },
        cookie,
      ),
      { params: Promise.resolve({ id: category.id }) },
    )
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(200)

    const deactivatedBrand = await updateBrandApi(
      request(
        `/api/admin/brands/${brand.id}`,
        'PATCH',
        { status: 'INACTIVE' },
        cookie,
      ),
      { params: Promise.resolve({ id: brand.id }) },
    )
    expect(deactivatedBrand.status).toBe(200)
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(404)
    const inactiveBrandAssociation = await createProductApi(
      request(
        '/api/admin/products',
        'POST',
        {
          name: 'Blocked brand association',
          brandId: brand.id,
          categoryIds: [category.id],
        },
        cookie,
      ),
    )
    expect(inactiveBrandAssociation.status).toBe(400)
    await updateBrandApi(
      request(
        `/api/admin/brands/${brand.id}`,
        'PATCH',
        { status: 'ACTIVE' },
        cookie,
      ),
      { params: Promise.resolve({ id: brand.id }) },
    )
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(200)

    const archived = await archiveProductApi(
      request(
        `/api/admin/products/${product.id}/archive`,
        'POST',
        undefined,
        cookie,
      ),
      { params: Promise.resolve({ id: product.id }) },
    )
    expect((await archived.json()).product.publicationState).toBe('ARCHIVED')
    expect(
      (
        await getPublicProductApi(request(`/api/products/${product.id}`), {
          params: Promise.resolve({ id: product.id }),
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await listAdminProductsApi(
          request('/api/admin/products', 'GET', undefined, cookie),
        )
      ).status,
    ).toBe(200)

    const audit = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM audit_logs
        WHERE actor_id = $1 AND resource_id = $2
          AND action IN ('PRODUCT_CREATED', 'PRODUCT_PUBLISHED', 'PRODUCT_ARCHIVED')`,
      [actorId, product.id],
    )
    expect(Number(audit.rows[0]?.count)).toBe(3)
  })
})
