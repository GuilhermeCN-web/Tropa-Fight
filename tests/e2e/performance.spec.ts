import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { loginViaUi, seed, uniqueEmail } from './fixtures'

// TASK-021 / RNF-022: medição de referência.
//
// Método (registrado em docs/TASKS/TASK021.MD):
// - build de produção (`next build` + `next start`) atrás do proxy TLS local,
//   PostgreSQL 18 no Docker Compose, mesma máquina, sem carga concorrente;
// - APIs: 2 requisições de aquecimento e 30 medidas por endpoint, tempo total
//   da resposta visto pelo cliente; meta p95 ≤ 2 s;
// - páginas críticas: 1 carga de aquecimento e 10 medidas por página no
//   Chromium, do início da navegação até a rede ociosa e o conteúdo principal
//   visível (inclui a busca de dados no cliente); meta p95 ≤ 3 s.
const apiSamples = 30
const pageSamples = 10

function p95(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.ceil(0.95 * sorted.length) - 1]!
}

function summary(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  return {
    samples: values.length,
    minMs: Math.round(sorted[0]!),
    medianMs: Math.round(sorted[Math.floor(sorted.length / 2)]!),
    p95Ms: Math.round(p95(values)),
    maxMs: Math.round(sorted.at(-1)!),
  }
}

async function customerWithOrder(page: Page) {
  const email = uniqueEmail('perf')
  await page.request.post('/api/auth/register', {
    data: { email, password: seed.password },
  })
  await loginViaUi(page, email)
  await page.request.post('/api/cart', {
    data: { variantId: seed.variantInStock.id, quantity: 1 },
  })
  const address = await page.request.post('/api/addresses', {
    data: {
      recipientName: 'Cliente Perf',
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
  })
  const addressId = (await address.json()).address.id as string
  const quote = await page.request.post('/api/checkout/quotes', {
    data: { addressId },
  })
  const order = await page.request.post('/api/checkout/orders', {
    headers: { 'Idempotency-Key': randomUUID() },
    data: { quoteId: (await quote.json()).quote.quoteId },
  })
  await page.request.post('/api/cart', {
    data: { variantId: seed.variantInStock.id, quantity: 1 },
  })
  return { addressId, orderId: (await order.json()).order.orderId as string }
}

test.describe('performance reference (RNF-022) @perf', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Reference measured on Chromium only',
  )
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < 1000,
    'Desktop reference only',
  )
  test.setTimeout(300_000)

  test('APIs: p95 ≤ 2 s and critical pages: p95 ≤ 3 s', async ({
    page,
  }, testInfo) => {
    const { addressId, orderId } = await customerWithOrder(page)

    const apis: Array<[string, () => Promise<unknown>]> = [
      ['GET /api/products', () => page.request.get('/api/products')],
      [
        'GET /api/products/{id}',
        () => page.request.get(`/api/products/${seed.product.id}`),
      ],
      ['GET /api/cart', () => page.request.get('/api/cart')],
      [
        'POST /api/checkout/quotes',
        () =>
          page.request.post('/api/checkout/quotes', { data: { addressId } }),
      ],
      ['GET /api/orders', () => page.request.get('/api/orders')],
      [
        'GET /api/orders/{id}',
        () => page.request.get(`/api/orders/${orderId}`),
      ],
      ['GET /api/health', () => page.request.get('/api/health')],
    ]
    const apiResults: Record<string, ReturnType<typeof summary>> = {}
    for (const [name, call] of apis) {
      for (let warmup = 0; warmup < 2; warmup += 1) await call()
      const timings: number[] = []
      for (let sample = 0; sample < apiSamples; sample += 1) {
        const started = performance.now()
        const response = (await call()) as { ok(): boolean }
        timings.push(performance.now() - started)
        expect(response.ok(), name).toBe(true)
      }
      apiResults[name] = summary(timings)
    }

    const pages: Array<[string, string, string | RegExp]> = [
      ['/catalog', '/catalog', 'Catálogo'],
      ['/products/{id}', `/products/${seed.product.id}`, seed.product.name],
      ['/cart', '/cart', 'Carrinho'],
      ['/checkout', '/checkout', 'Checkout'],
      ['/orders', '/orders', 'Meus pedidos'],
      ['/orders/{id}', `/orders/${orderId}`, 'Pedido'],
    ]
    const pageResults: Record<string, ReturnType<typeof summary>> = {}
    for (const [name, path, heading] of pages) {
      const load = async () => {
        const started = performance.now()
        await page.goto(path, { waitUntil: 'networkidle' })
        await expect(
          page.getByRole('heading', { level: 1, name: heading }),
        ).toBeVisible()
        await expect(page.getByText(/^Carregando/)).toHaveCount(0)
        return performance.now() - started
      }
      await load()
      const timings: number[] = []
      for (let sample = 0; sample < pageSamples; sample += 1)
        timings.push(await load())
      pageResults[name] = summary(timings)
    }

    const report = { apis: apiResults, pages: pageResults }
    await testInfo.attach('rnf-022-reference', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    console.log(JSON.stringify(report, null, 2))

    for (const [name, result] of Object.entries(apiResults))
      expect(result.p95Ms, `${name} p95`).toBeLessThanOrEqual(2_000)
    for (const [name, result] of Object.entries(pageResults))
      expect(result.p95Ms, `${name} p95`).toBeLessThanOrEqual(3_000)
  })
})
