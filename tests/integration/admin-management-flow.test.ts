import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { sessionCookieName } from '../../src/modules/auth/application/session-service'
import { GET as listAdminOrders } from '../../app/api/admin/orders/route'
import { GET as listAdminCustomers } from '../../app/api/admin/customers/route'
import { GET as getAdminCustomer } from '../../app/api/admin/customers/[customerId]/route'
import { GET as listAdminProducts } from '../../app/api/admin/products/route'
import { GET as listAdminCategories } from '../../app/api/admin/categories/route'
import { GET as listAdminBrands } from '../../app/api/admin/brands/route'
import { GET as getInventoryBalance } from '../../app/api/admin/inventory/[variantId]/route'

// TASK-018: RF-023, RF-031–RF-034; RN-016, RN-018, RN-019; UC-014–UC-017.
const configured = Boolean(process.env.DATABASE_URL)
const pool = configured ? getDatabasePool() : undefined
const marker = randomUUID().slice(0, 8)
const emailDomain = `admin-mgmt-${marker}.test`
const ids = {
  activeCustomer: randomUUID(),
  suspendedCustomer: randomUUID(),
  generalAdmin: randomUUID(),
  catalogManager: randomUUID(),
  carts: [randomUUID(), randomUUID(), randomUUID()],
  orders: [randomUUID(), randomUUID(), randomUUID()],
}
const orderFixtures = [
  {
    owner: ids.activeCustomer,
    status: 'PENDING_PAYMENT',
    createdAt: '2025-01-10T12:00:00.000Z',
  },
  {
    owner: ids.activeCustomer,
    status: 'PAYMENT_CONFIRMED',
    createdAt: '2025-01-11T00:00:00.000Z',
  },
  {
    owner: ids.suspendedCustomer,
    status: 'PAYMENT_CONFIRMED',
    createdAt: '2025-01-12T08:30:00.000Z',
  },
]
const tokens: Record<'customer' | 'general' | 'catalog', string | undefined> = {
  customer: undefined,
  general: undefined,
  catalog: undefined,
}

function request(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { cookie: `${sessionCookieName}=${token}` } : undefined,
  })
}

const customerContext = (customerId: string) => ({
  params: Promise.resolve({ customerId }),
})

type OrdersBody = {
  orders: Array<{ id: string; status: string; createdAt: string }>
  total: number
}

async function adminOrders(path: string, token?: string) {
  const response = await listAdminOrders(request(path, token))
  if (!response) throw new Error('Admin order route returned no response.')
  return response
}

async function fixtureOrders(query: string) {
  const response = await adminOrders(
    `/api/admin/orders?pageSize=100&${query}`,
    tokens.general,
  )
  expect(response.status).toBe(200)
  const body = (await response.json()) as OrdersBody
  return body.orders.filter((order) =>
    (ids.orders as string[]).includes(order.id),
  )
}

async function snapshotState() {
  const result = await pool!.query<{ snapshot: string }>(
    `SELECT json_build_object(
       'users', (SELECT json_agg(u ORDER BY u.id) FROM identity_users u
                  WHERE u.id=ANY($1::uuid[])),
       'orders', (SELECT json_agg(o ORDER BY o.id) FROM orders o
                   WHERE o.id=ANY($2::uuid[])))::text AS snapshot`,
    [[ids.activeCustomer, ids.suspendedCustomer], ids.orders],
  )
  return result.rows[0]?.snapshot
}

describe.skipIf(!configured)('administrative management API (TASK-018)', () => {
  beforeAll(async () => {
    const client = await pool!.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type,status,created_at)
         VALUES ($1,$2,'test-hash','CUSTOMER','ACTIVE','2025-01-01T00:00:00Z'),
                ($3,$4,'test-hash','CUSTOMER','SUSPENDED','2025-01-02T00:00:00Z'),
                ($5,$6,'test-hash','ADMIN','ACTIVE','2025-01-03T00:00:00Z'),
                ($7,$8,'test-hash','ADMIN','ACTIVE','2025-01-04T00:00:00Z')`,
        [
          ids.activeCustomer,
          `Buyer.One@${emailDomain}`,
          ids.suspendedCustomer,
          `buyer_two@${emailDomain}`,
          ids.generalAdmin,
          `general@${emailDomain}`,
          ids.catalogManager,
          `catalog@${emailDomain}`,
        ],
      )
      await client.query(
        `INSERT INTO identity_user_roles (user_id,role_code)
         VALUES ($1,'CUSTOMER'),($2,'CUSTOMER'),($3,'GENERAL_ADMIN'),($4,'CATALOG_MANAGER')`,
        [
          ids.activeCustomer,
          ids.suspendedCustomer,
          ids.generalAdmin,
          ids.catalogManager,
        ],
      )
      const address = {
        recipientName: 'Cliente de teste',
        cpf: '52998224725',
        phone: '11999991212',
        postalCode: '01310100',
        street: 'Av. Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      }
      for (const [index, order] of orderFixtures.entries()) {
        await client.query(
          `INSERT INTO carts (id,customer_id,status) VALUES ($1,$2,'CONVERTED')`,
          [ids.carts[index], order.owner],
        )
        await client.query(
          `INSERT INTO orders
            (id,customer_id,cart_id,status,subtotal_cents,discount_cents,
             shipping_cents,total_cents,address_snapshot,payment_due_at,created_at)
           VALUES ($1,$2,$3,$4,10000,0,2000,12000,$5::jsonb,
                   $6::timestamptz+interval '30 days',$6)`,
          [
            ids.orders[index],
            order.owner,
            ids.carts[index],
            order.status,
            JSON.stringify(address),
            order.createdAt,
          ],
        )
        await client.query(
          'UPDATE carts SET converted_to_order_id=$2 WHERE id=$1',
          [ids.carts[index], ids.orders[index]],
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    tokens.customer = await createSession(ids.activeCustomer)
    tokens.general = await createSession(ids.generalAdmin)
    tokens.catalog = await createSession(ids.catalogManager)
  })

  afterAll(async () => {
    for (const token of Object.values(tokens))
      if (token) await revokeSession(token)
    if (!configured) return
    await pool!.query(
      'UPDATE carts SET converted_to_order_id=NULL WHERE id=ANY($1::uuid[])',
      [ids.carts],
    )
    await pool!.query('DELETE FROM orders WHERE id=ANY($1::uuid[])', [
      ids.orders,
    ])
    await pool!.query('DELETE FROM carts WHERE id=ANY($1::uuid[])', [ids.carts])
    await pool!.query('DELETE FROM identity_users WHERE email LIKE $1', [
      `%@${emailDomain}`,
    ])
  })

  describe('order filters (RF-033)', () => {
    it('filters by status alone', async () => {
      const orders = await fixtureOrders('status=PAYMENT_CONFIRMED')
      expect(orders.map((order) => order.id).sort()).toEqual(
        [ids.orders[1], ids.orders[2]].sort(),
      )
      const all = await adminOrders(
        '/api/admin/orders?pageSize=100&status=PAYMENT_CONFIRMED',
        tokens.general,
      )
      const body = (await all.json()) as OrdersBody
      expect(
        body.orders.every((order) => order.status === 'PAYMENT_CONFIRMED'),
      ).toBe(true)
    })

    it('treats `from` as inclusive and `to` as exclusive', async () => {
      const from = await fixtureOrders('from=2025-01-11T00:00:00Z')
      expect(from.map((order) => order.id).sort()).toEqual(
        [ids.orders[1], ids.orders[2]].sort(),
      )
      const to = await fixtureOrders('to=2025-01-11T00:00:00Z')
      expect(to.map((order) => order.id)).toEqual([ids.orders[0]])
    })

    it('combines status and period filters', async () => {
      const orders = await fixtureOrders(
        'status=PAYMENT_CONFIRMED&from=2025-01-10&to=2025-01-12',
      )
      expect(orders.map((order) => order.id)).toEqual([ids.orders[1]])
      const outside = await fixtureOrders(
        'status=PENDING_PAYMENT&from=2025-01-11',
      )
      expect(outside).toEqual([])
    })

    it.each([
      'status=CANCELLED',
      'status=',
      'from=2025-13-01',
      'from=2025-02-30',
      'from=yesterday',
      'to=2025-01-10T10:00:00',
      'from=2025-01-12&to=2025-01-12',
      'from=2025-01-13&to=2025-01-12',
      'status=EXPIRED&status=PENDING_PAYMENT',
      'customerId=abc',
    ])('rejects invalid filter %s with 400', async (query) => {
      const response = await adminOrders(
        `/api/admin/orders?${query}`,
        tokens.general,
      )
      expect(response.status).toBe(400)
    })

    it('keeps the order filters restricted to GENERAL_ADMIN', async () => {
      const path = '/api/admin/orders?status=PAYMENT_CONFIRMED'
      expect((await listAdminOrders(request(path)))?.status).toBe(401)
      expect(
        (await listAdminOrders(request(path, tokens.customer)))?.status,
      ).toBe(403)
      expect(
        (await listAdminOrders(request(path, tokens.catalog)))?.status,
      ).toBe(403)
    })
  })

  describe('customer consultation (RF-034)', () => {
    it('lists customers with only the approved fields and order counts', async () => {
      const response = await listAdminCustomers(
        request(`/api/admin/customers?email=${emailDomain}`, tokens.general),
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      const body = await response.json()
      expect(body).toMatchObject({ page: 1, pageSize: 20, total: 2 })
      expect(body.customers).toEqual([
        {
          id: ids.suspendedCustomer,
          email: `buyer_two@${emailDomain}`,
          status: 'SUSPENDED',
          createdAt: '2025-01-02T00:00:00.000Z',
          ordersCount: 1,
        },
        {
          id: ids.activeCustomer,
          email: `Buyer.One@${emailDomain}`,
          status: 'ACTIVE',
          createdAt: '2025-01-01T00:00:00.000Z',
          ordersCount: 2,
        },
      ])
      const serialized = JSON.stringify(body)
      for (const forbidden of ['cpf', 'phone', 'address', 'password', 'hash'])
        expect(serialized.toLowerCase()).not.toContain(forbidden)
    })

    it('filters by partial e-mail without case sensitivity and by status', async () => {
      const partial = await listAdminCustomers(
        request(
          `/api/admin/customers?email=BUYER.ONE@${emailDomain.toUpperCase()}`,
          tokens.general,
        ),
      )
      expect(
        (await partial.json()).customers.map((c: { id: string }) => c.id),
      ).toEqual([ids.activeCustomer])

      // `_` and `%` are literal characters, not LIKE wildcards.
      const literal = await listAdminCustomers(
        request(`/api/admin/customers?email=buyer_two@`, tokens.general),
      )
      const literalIds = (await literal.json()).customers.map(
        (c: { id: string }) => c.id,
      )
      expect(literalIds).toContain(ids.suspendedCustomer)
      expect(literalIds).not.toContain(ids.activeCustomer)

      const wildcard = await listAdminCustomers(
        request(
          `/api/admin/customers?email=${encodeURIComponent(`%@${emailDomain}`)}`,
          tokens.general,
        ),
      )
      expect((await wildcard.json()).total).toBe(0)

      const suspended = await listAdminCustomers(
        request(
          `/api/admin/customers?email=${emailDomain}&status=SUSPENDED`,
          tokens.general,
        ),
      )
      expect(
        (await suspended.json()).customers.map((c: { id: string }) => c.id),
      ).toEqual([ids.suspendedCustomer])
    })

    it('excludes administrative accounts and paginates', async () => {
      const page = await listAdminCustomers(
        request(
          `/api/admin/customers?email=${emailDomain}&page=2&pageSize=1`,
          tokens.general,
        ),
      )
      const body = await page.json()
      expect(body).toMatchObject({ page: 2, pageSize: 1, total: 2 })
      expect(body.customers.map((c: { id: string }) => c.id)).toEqual([
        ids.activeCustomer,
      ])
    })

    it.each([
      'status=BANNED',
      'email=',
      'email=%20%20',
      'page=0',
      'pageSize=101',
      'email=a&email=b',
      'cpf=52998224725',
    ])('rejects invalid query %s with 400', async (query) => {
      const response = await listAdminCustomers(
        request(`/api/admin/customers?${query}`, tokens.general),
      )
      expect(response.status).toBe(400)
    })

    it('returns the detail with an order summary and no sensitive data', async () => {
      const response = await getAdminCustomer(
        request(`/api/admin/customers/${ids.activeCustomer}`, tokens.general),
        customerContext(ids.activeCustomer),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.customer).toEqual({
        id: ids.activeCustomer,
        email: `Buyer.One@${emailDomain}`,
        status: 'ACTIVE',
        createdAt: '2025-01-01T00:00:00.000Z',
        ordersCount: 2,
        orders: [
          {
            id: ids.orders[1],
            status: 'PAYMENT_CONFIRMED',
            totalCents: 12000,
            createdAt: '2025-01-11T00:00:00.000Z',
          },
          {
            id: ids.orders[0],
            status: 'PENDING_PAYMENT',
            totalCents: 12000,
            createdAt: '2025-01-10T12:00:00.000Z',
          },
        ],
      })
      expect(JSON.stringify(body).toLowerCase()).not.toContain('cpf')
    })

    it('returns 404 for unknown, malformed and administrative ids', async () => {
      for (const customerId of [
        randomUUID(),
        'not-a-uuid',
        ids.generalAdmin,
        ids.catalogManager,
      ]) {
        const response = await getAdminCustomer(
          request(`/api/admin/customers/${customerId}`, tokens.general),
          customerContext(customerId),
        )
        expect(response.status).toBe(404)
      }
    })

    it('allows only GENERAL_ADMIN', async () => {
      const detailPath = `/api/admin/customers/${ids.activeCustomer}`
      expect(
        (await listAdminCustomers(request('/api/admin/customers')))?.status,
      ).toBe(401)
      expect(
        (
          await getAdminCustomer(
            request(detailPath),
            customerContext(ids.activeCustomer),
          )
        )?.status,
      ).toBe(401)
      for (const token of [tokens.customer, tokens.catalog]) {
        expect(
          (await listAdminCustomers(request('/api/admin/customers', token)))
            ?.status,
        ).toBe(403)
        expect(
          (
            await getAdminCustomer(
              request(detailPath, token),
              customerContext(ids.activeCustomer),
            )
          )?.status,
        ).toBe(403)
      }
    })

    it('does not change state when queried', async () => {
      const before = await snapshotState()
      await listAdminCustomers(
        request(`/api/admin/customers?email=${emailDomain}`, tokens.general),
      )
      await getAdminCustomer(
        request(`/api/admin/customers/${ids.activeCustomer}`, tokens.general),
        customerContext(ids.activeCustomer),
      )
      await fixtureOrders('status=PAYMENT_CONFIRMED&from=2025-01-01')
      expect(await snapshotState()).toBe(before)
    })
  })

  describe('catalog and stock administration RBAC (RF-031, RF-032)', () => {
    const catalogReads = [
      ['products', () => listAdminProducts],
      ['categories', () => listAdminCategories],
      ['brands', () => listAdminBrands],
    ] as const

    it.each(catalogReads)(
      'allows GENERAL_ADMIN and CATALOG_MANAGER on admin %s and denies CUSTOMER',
      async (resource, handler) => {
        const path = `/api/admin/${resource}`
        expect((await handler()(request(path, tokens.general)))?.status).toBe(
          200,
        )
        expect((await handler()(request(path, tokens.catalog)))?.status).toBe(
          200,
        )
        expect((await handler()(request(path, tokens.customer)))?.status).toBe(
          403,
        )
        expect((await handler()(request(path)))?.status).toBe(401)
      },
    )

    it('allows both administrative roles on stock and denies CUSTOMER', async () => {
      const variantId = randomUUID()
      const context = { params: Promise.resolve({ variantId }) }
      const path = `/api/admin/inventory/${variantId}`
      // Authorized roles reach the resource lookup (unknown variant → 404).
      expect(
        (await getInventoryBalance(request(path, tokens.general), context))
          ?.status,
      ).toBe(404)
      expect(
        (await getInventoryBalance(request(path, tokens.catalog), context))
          ?.status,
      ).toBe(404)
      expect(
        (await getInventoryBalance(request(path, tokens.customer), context))
          ?.status,
      ).toBe(403)
      expect((await getInventoryBalance(request(path), context))?.status).toBe(
        401,
      )
    })
  })
})
