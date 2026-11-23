import { randomUUID } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import {
  expectNoHorizontalOverflow,
  loginViaUi,
  seed,
  uniqueEmail,
} from './fixtures'

// TASK-021: WCAG 2.2 AA automatizado (RNF-020) e responsividade a 360 px
// (RNF-021) em todas as páginas existentes, nos três motores.
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function audit(page: Page, testInfo: TestInfo, name: string) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    help: violation.help,
  }))
  await testInfo.attach(`axe-${name}`, {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json',
  })
  const blocking = summary.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking, `serious/critical WCAG violations on ${name}`).toEqual([])
  await expectNoHorizontalOverflow(page)
}

/** Creates an order through the public APIs so every page has content. */
async function customerWithOrder(page: Page) {
  const email = uniqueEmail('a11y')
  expect(
    (
      await page.request.post('/api/auth/register', {
        data: { email, password: seed.password },
      })
    ).ok(),
  ).toBe(true)
  await loginViaUi(page, email)
  const cart = await page.request.post('/api/cart', {
    data: { variantId: seed.variantInStock.id, quantity: 1 },
  })
  expect(cart.ok(), await cart.text()).toBe(true)
  const address = await page.request.post('/api/addresses', {
    data: {
      recipientName: 'Cliente A11y',
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
  expect(address.ok(), await address.text()).toBe(true)
  const addressId = (await address.json()).address.id as string
  const quote = await page.request.post('/api/checkout/quotes', {
    data: { addressId },
  })
  expect(quote.ok(), await quote.text()).toBe(true)
  const quoteId = (await quote.json()).quote.quoteId as string
  const order = await page.request.post('/api/checkout/orders', {
    headers: { 'Idempotency-Key': randomUUID() },
    data: { quoteId },
  })
  expect(order.ok(), await order.text()).toBe(true)
  // Keep an item in the cart so /cart and /checkout render their full forms.
  await page.request.post('/api/cart', {
    data: { variantId: seed.variantInStock.id, quantity: 1 },
  })
  return (await order.json()).order.orderId as string
}

test.describe('accessibility (WCAG 2.2 AA) and 360 px layout', () => {
  for (const path of [
    '/',
    '/catalog',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ]) {
    test(`public page ${path}`, async ({ page }, testInfo) => {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await audit(page, testInfo, path)
    })
  }

  test('product page', async ({ page }, testInfo) => {
    await page.goto(`/products/${seed.product.id}`)
    await expect(
      page.getByRole('heading', { level: 1, name: seed.product.name }),
    ).toBeVisible()
    await audit(page, testInfo, 'product')
  })

  test('customer pages: profile, cart, checkout, orders and order detail', async ({
    page,
  }, testInfo) => {
    const orderId = await customerWithOrder(page)
    const pages: Array<[string, string | RegExp]> = [
      ['/profile', /perfil|conta/i],
      ['/cart', 'Carrinho'],
      ['/checkout', 'Checkout'],
      ['/orders', 'Meus pedidos'],
      [`/orders/${orderId}`, 'Pedido'],
    ]
    for (const [path, heading] of pages) {
      await page.goto(path)
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toBeVisible()
      // Wait for client-side data to settle before auditing.
      await expect(page.getByText(/^Carregando/)).toHaveCount(0)
      await audit(
        page,
        testInfo,
        path.startsWith('/orders/') ? 'order-detail' : path,
      )
    }
  })

  test('keyboard: skip link is the first focus stop and reaches the content', async ({
    page,
    browserName,
  }) => {
    await page.goto('/catalog')
    // WebKit only tabs to links when "Press Tab to highlight each item" is on.
    const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
    await page.keyboard.press(key)
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#conteudo$/)
  })
})
