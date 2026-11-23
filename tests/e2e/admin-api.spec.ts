import { randomUUID } from 'node:crypto'
import { expect, test, type APIRequestContext } from '@playwright/test'
import { seed, signedWebhook, uniqueEmail } from './fixtures'

// TASK-021: testes de API dos fluxos administrativos contra o servidor real
// (RF-031–RF-038; RN-016, RN-019, RN-022; UC-012–UC-020). Independem do
// navegador, por isso rodam só no projeto `chromium` (tag @api).
test.describe.configure({ mode: 'serial' })

const marker = randomUUID().slice(0, 8)
let admin: APIRequestContext
let catalog: APIRequestContext
let customer: APIRequestContext
let anonymous: APIRequestContext
let customerEmail: string
let purchase:
  { orderId: string; paymentId: string; amountCents: number } | undefined

async function session(
  playwright: {
    request: { newContext: (options: object) => Promise<APIRequestContext> }
  },
  baseURL: string,
  email?: string,
) {
  const context = await playwright.request.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  })
  if (email) {
    const login = await context.post('/api/auth/login', {
      data: { email, password: seed.password },
    })
    expect(login.ok(), `login ${email}`).toBe(true)
  }
  return context
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

async function json(
  responsePromise: ReturnType<APIRequestContext['get']>,
  status: number,
): Promise<Json> {
  const response = await responsePromise
  expect(response.status(), await response.text()).toBe(status)
  return response.json()
}

test.describe('administrative API flows @api', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'API flows are browser independent',
  )

  test.beforeAll(async ({ playwright, baseURL }) => {
    admin = await session(playwright, baseURL!, seed.generalAdmin.email)
    catalog = await session(playwright, baseURL!, seed.catalogManager.email)
    anonymous = await session(playwright, baseURL!)
    customerEmail = uniqueEmail('admin-api')
    customer = await session(playwright, baseURL!)
    expect(
      (
        await customer.post('/api/auth/register', {
          data: { email: customerEmail, password: seed.password },
        })
      ).ok(),
    ).toBe(true)
    expect(
      (
        await customer.post('/api/auth/login', {
          data: { email: customerEmail, password: seed.password },
        })
      ).ok(),
    ).toBe(true)
  })

  test.afterAll(async () => {
    for (const context of [admin, catalog, customer, anonymous])
      await context?.dispose()
  })

  test('catalog manager creates, stocks and publishes a product (RF-031, RF-032)', async () => {
    const category = (
      await json(
        catalog.post('/api/admin/categories', {
          data: { name: `Cat ${marker}` },
        }),
        201,
      )
    ).category
    const brand = (
      await json(
        catalog.post('/api/admin/brands', {
          data: { name: `Marca ${marker}` },
        }),
        201,
      )
    ).brand
    const product = (
      await json(
        catalog.post('/api/admin/products', {
          data: {
            name: `Caneleira ${marker}`,
            description: 'Produto criado pelo teste E2E de administração.',
            brandId: brand.id,
            categoryIds: [category.id],
          },
        }),
        201,
      )
    ).product
    const variant = (
      await json(
        catalog.post(`/api/admin/products/${product.id}/variants`, {
          data: {
            sku: `E2E-${marker}`,
            attributes: { size: 'M' },
            priceCents: 9_990,
            status: 'ACTIVE',
          },
        }),
        201,
      )
    ).variant
    await json(
      catalog.post(`/api/admin/inventory/${variant.id}/entries`, {
        data: { quantity: 5, reason: 'Entrada E2E' },
      }),
      201,
    )
    const published = await json(
      catalog.post(`/api/admin/products/${product.id}/publish`),
      200,
    )
    expect(published.product.publicationState).toBe('PUBLISHED')
    const balance = await json(
      catalog.get(`/api/admin/inventory/${variant.id}`),
      200,
    )
    expect(JSON.stringify(balance)).toContain('"quantity":5')

    const publicProduct = await json(
      anonymous.get(`/api/products/${product.id}`),
      200,
    )
    expect(JSON.stringify(publicProduct)).toContain(`Caneleira ${marker}`)

    // Customers and anonymous visitors cannot administer the catalog.
    expect(
      (
        await customer.post('/api/admin/categories', {
          data: { name: `X ${marker}` },
        })
      ).status(),
    ).toBe(403)
    expect(
      (
        await anonymous.post('/api/admin/categories', {
          data: { name: `X ${marker}` },
        })
      ).status(),
    ).toBe(401)
  })

  test('customer buys, pays and reviews; admin consults and moderates (RF-033, RF-034, RF-037)', async () => {
    await json(
      customer.post('/api/cart', {
        data: { variantId: seed.variantInStock.id, quantity: 1 },
      }),
      201,
    )
    const address = (
      await json(
        customer.post('/api/addresses', {
          data: {
            recipientName: 'Cliente Admin API',
            cpf: '52998224725',
            phone: '11999991212',
            postalCode: '01310100',
            street: 'Av. Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR',
          },
        }),
        201,
      )
    ).address
    const quote = (
      await json(
        customer.post('/api/checkout/quotes', {
          data: { addressId: address.id },
        }),
        201,
      )
    ).quote
    const order = (
      await json(
        customer.post('/api/checkout/orders', {
          headers: { 'Idempotency-Key': randomUUID() },
          data: { quoteId: quote.quoteId },
        }),
        201,
      )
    ).order
    const payment = (
      await json(
        customer.post('/api/payments', {
          headers: { 'Idempotency-Key': randomUUID() },
          data: { orderId: order.orderId, method: 'PIX' },
        }),
        201,
      )
    ).payment
    for (const type of ['payment.processing', 'payment.approved']) {
      const { body, signature } = signedWebhook({
        id: `local-sim-${randomUUID()}`,
        type,
        paymentId: payment.paymentId,
        orderId: order.orderId,
        amountCents: payment.amountCents,
        currency: 'BRL',
        occurredAt: new Date().toISOString(),
      })
      await json(
        anonymous.post('/api/payments/webhook', {
          headers: {
            'content-type': 'application/json',
            'x-payment-signature': signature,
          },
          data: body,
        }),
        200,
      )
    }

    purchase = {
      orderId: order.orderId,
      paymentId: payment.paymentId,
      amountCents: payment.amountCents,
    }

    // Admin: order filters (RF-033).
    const today = new Date().toISOString().slice(0, 10)
    const confirmed = await json(
      admin.get(
        `/api/admin/orders?status=PAYMENT_CONFIRMED&from=${today}&pageSize=100`,
      ),
      200,
    )
    expect(confirmed.orders.map((item: { id: string }) => item.id)).toContain(
      order.orderId,
    )
    expect(
      (await admin.get('/api/admin/orders?status=CANCELLED')).status(),
    ).toBe(400)

    // Admin: customer consultation without personal data (RF-034).
    const customers = await json(
      admin.get(`/api/admin/customers?email=${customerEmail}`),
      200,
    )
    expect(customers.customers).toHaveLength(1)
    expect(customers.customers[0]).toMatchObject({
      email: customerEmail,
      ordersCount: 1,
    })
    const detail = await json(
      admin.get(`/api/admin/customers/${customers.customers[0].id}`),
      200,
    )
    expect(detail.customer.orders[0]).toMatchObject({
      id: order.orderId,
      status: 'PAYMENT_CONFIRMED',
    })
    expect(JSON.stringify(detail)).not.toMatch(
      /cpf|52998224725|phone|Paulista/i,
    )

    // Customer reviews the purchased product; admin publishes it (RF-037).
    const review = (
      await json(
        customer.post(`/api/products/${seed.product.id}/reviews`, {
          data: { rating: 5, comment: `Avaliação E2E ${marker}` },
        }),
        201,
      )
    ).review
    const queue = await json(admin.get('/api/admin/reviews?pageSize=100'), 200)
    expect(queue.reviews.map((item: { id: string }) => item.id)).toContain(
      review.id,
    )
    await json(
      admin.patch(`/api/admin/reviews/${review.id}`, {
        data: { status: 'PUBLISHED' },
      }),
      200,
    )
    expect(
      (
        await admin.patch(`/api/admin/reviews/${review.id}`, {
          data: { status: 'REJECTED' },
        })
      ).status(),
    ).toBe(409)
    const publicReviews = await json(
      anonymous.get(`/api/products/${seed.product.id}/reviews?pageSize=100`),
      200,
    )
    expect(JSON.stringify(publicReviews)).toContain(`Avaliação E2E ${marker}`)
  })

  test('general admin manages administrative accounts (RF-038, RN-022)', async ({
    playwright,
    baseURL,
  }) => {
    const email = `gerente-${marker}@e2e.test`
    const created = (
      await json(
        admin.post('/api/admin/users', {
          data: { email, password: seed.password, role: 'CATALOG_MANAGER' },
        }),
        201,
      )
    ).user
    const manager = await session(playwright, baseURL!, email)
    expect((await manager.get('/api/admin/users')).status()).toBe(403)

    await json(
      admin.patch(`/api/admin/users/${created.id}`, {
        data: { status: 'INACTIVE' },
      }),
      200,
    )
    // Session revoked on deactivation.
    expect((await manager.get('/api/me')).status()).toBe(401)
    await manager.dispose()

    // RN-022: only meaningful when the seeded admin is the last active one
    // (always true in a freshly seeded E2E database).
    const users = await json(admin.get('/api/admin/users'), 200)
    const activeGenerals = users.users.filter(
      (user: { role: string; status: string }) =>
        user.role === 'GENERAL_ADMIN' && user.status === 'ACTIVE',
    )
    test.skip(
      activeGenerals.length !== 1,
      'Another active GENERAL_ADMIN exists in this database.',
    )
    const self = await admin.patch(`/api/admin/users/${seed.generalAdmin.id}`, {
      data: { status: 'INACTIVE' },
    })
    expect(self.status()).toBe(409)
    expect((await self.json()).code).toBe('LAST_GENERAL_ADMIN')
  })

  test('denies every administrative route to customers (403) and visitors (401)', async () => {
    const routes = [
      '/api/admin/orders',
      '/api/admin/customers',
      '/api/admin/reviews',
      '/api/admin/users',
      '/api/admin/audit-logs',
      '/api/admin/products',
      '/api/admin/promotions',
      '/api/admin/coupons',
      `/api/admin/inventory/${seed.variantInStock.id}`,
    ]
    for (const route of routes) {
      expect((await customer.get(route)).status(), `customer ${route}`).toBe(
        403,
      )
      expect((await anonymous.get(route)).status(), `anonymous ${route}`).toBe(
        401,
      )
    }
    for (const route of [
      '/api/admin/customers',
      '/api/admin/reviews',
      '/api/admin/users',
      '/api/admin/audit-logs',
    ])
      expect(
        (await catalog.get(route)).status(),
        `catalog manager ${route}`,
      ).toBe(403)
  })

  test('isolates customer data: another customer gets 404 (ownership, RN-016)', async ({
    playwright,
    baseURL,
  }) => {
    expect(purchase).toBeDefined()
    const otherEmail = uniqueEmail('intruso')
    const other = await session(playwright, baseURL!)
    await json(
      other.post('/api/auth/register', {
        data: { email: otherEmail, password: seed.password },
      }),
      201,
    )
    expect(
      (
        await other.post('/api/auth/login', {
          data: { email: otherEmail, password: seed.password },
        })
      ).ok(),
    ).toBe(true)
    for (const route of [
      `/api/orders/${purchase!.orderId}`,
      `/api/orders/${purchase!.orderId}/tracking`,
      `/api/payments/${purchase!.paymentId}`,
    ])
      expect((await other.get(route)).status(), route).toBe(404)
    const history = await json(other.get('/api/orders'), 200)
    expect(history.orders).toEqual([])
    await other.dispose()
  })

  test('rejects webhooks with an invalid signature without changing the payment', async () => {
    expect(purchase).toBeDefined()
    const body = JSON.stringify({
      id: `forged-${randomUUID()}`,
      type: 'payment.failed',
      paymentId: purchase!.paymentId,
      orderId: purchase!.orderId,
      amountCents: purchase!.amountCents,
      currency: 'BRL',
      occurredAt: new Date().toISOString(),
    })
    const forged = await anonymous.post('/api/payments/webhook', {
      headers: {
        'content-type': 'application/json',
        'x-payment-signature': `sha256=${'0'.repeat(64)}`,
      },
      data: body,
    })
    expect(forged.status()).toBe(401)
    const unsigned = await anonymous.post('/api/payments/webhook', {
      headers: { 'content-type': 'application/json' },
      data: body,
    })
    expect(unsigned.status()).toBe(401)
    const order = await json(
      admin.get(`/api/admin/orders/${purchase!.orderId}`),
      200,
    )
    expect(order.order.status).toBe('PAYMENT_CONFIRMED')
    expect(order.order.payment.status).toBe('APPROVED')
  })

  test('audit log records the administrative operations without personal data (RN-019)', async () => {
    const logs = await json(
      admin.get(
        `/api/admin/audit-logs?actorId=${seed.generalAdmin.id}&pageSize=100`,
      ),
      200,
    )
    const entries = Object.values(logs).find(Array.isArray) as Array<{
      action: string
    }>
    const actions = new Set(entries.map((entry) => entry.action))
    for (const action of ['REVIEW_PUBLISHED', 'USER_CREATED', 'USER_UPDATED'])
      expect(actions).toContain(action)
    expect(JSON.stringify(entries)).not.toMatch(/@|password|52998224725/i)
  })
})
