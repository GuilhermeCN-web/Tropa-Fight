import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  expectNoHorizontalOverflow,
  loginViaUi,
  seed,
  signedWebhook,
  uniqueEmail,
} from './fixtures'

// TASK-021: fluxos da TASK-023 (UC-005 a UC-011) nos três motores, desktop e 360 px.

async function newCustomer(page: Page) {
  const email = uniqueEmail('compra')
  const response = await page.request.post('/api/auth/register', {
    data: { email, password: seed.password },
  })
  expect(response.ok()).toBe(true)
  await loginViaUi(page, email)
  return email
}

async function sendPaymentEvent(
  page: Page,
  type: string,
  paymentId: string,
  orderId: string,
  amountCents: number,
) {
  const { body, signature } = signedWebhook({
    id: `local-sim-${randomUUID()}`,
    type,
    paymentId,
    orderId,
    amountCents,
    currency: 'BRL',
    occurredAt: new Date().toISOString(),
  })
  const response = await page.request.post('/api/payments/webhook', {
    headers: {
      'content-type': 'application/json',
      'x-payment-signature': signature,
    },
    data: body,
  })
  expect(response.status(), await response.text()).toBe(200)
}

async function addToCart(page: Page, quantity: string) {
  await page.goto('/catalog')
  await page.getByRole('link', { name: seed.product.name }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: seed.product.name }),
  ).toBeVisible()
  await page.getByRole('radio', { name: /12oz/ }).check()
  await page.getByLabel('Quantidade').fill(quantity)
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('Item adicionado ao carrinho.')).toBeVisible()
}

test.describe('storefront purchase flow', () => {
  test('buys a product with a coupon and sees the confirmed order', async ({
    page,
  }) => {
    await newCustomer(page)
    await addToCart(page, '2')
    await expectNoHorizontalOverflow(page)

    await page.getByRole('link', { name: 'Ver carrinho' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Carrinho' }),
    ).toBeVisible()
    await page.getByLabel(`Quantidade de ${seed.product.name}`).fill('3')
    await page.getByRole('button', { name: 'Atualizar' }).click()
    // Server-computed subtotal: 3 × R$ 150,00.
    await expect(page.getByText(/R\$\s?450,00/).first()).toBeVisible()

    await page.getByLabel('Código do cupom').fill('INEXISTENTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()

    await page.getByLabel('Código do cupom').fill(seed.coupon.code)
    await page.getByRole('button', { name: 'Aplicar' }).click()
    // 10 % off R$ 450,00.
    await expect(page.getByText(/R\$\s?45,00/).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.getByRole('link', { name: /checkout|finalizar/i }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Checkout' }),
    ).toBeVisible()
    await page.getByLabel('Nome do destinatário').fill('Cliente E2E')
    await page.getByLabel('CPF').fill('52998224725')
    await page.getByLabel('Telefone com DDD').fill('11999991212')
    await page.getByLabel('CEP').fill('01310100')
    await page.getByLabel('Rua').fill('Av. Paulista')
    await page.getByLabel('Número', { exact: true }).fill('1000')
    await page.getByLabel('Bairro').fill('Bela Vista')
    await page.getByLabel('Cidade').fill('São Paulo')
    await page.getByLabel('UF').fill('SP')
    await page.getByRole('button', { name: 'Salvar endereço' }).click()

    await page.getByRole('button', { name: 'Calcular frete e total' }).click()
    // Subtotal 450 − desconto 45 + frete 20 = R$ 425,00 (valores do servidor).
    const confirm = page.getByRole('button', {
      name: /Confirmar pedido de R\$\s?425,00/,
    })
    await expect(confirm).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await confirm.click()
    await expect(
      page.getByRole('heading', { name: 'Pedido criado' }),
    ).toBeVisible()

    const orderHref = await page
      .getByRole('link', { name: 'Ver detalhes do pedido' })
      .getAttribute('href')
    const orderId = orderHref!.split('/').pop()!

    await page.getByRole('radio', { name: 'PIX' }).check()
    await page.getByRole('button', { name: 'Pagar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Pagamento simulado criado' }),
    ).toBeVisible()
    const paymentId = (await page
      .locator('dd code')
      .first()
      .textContent())!.trim()

    await sendPaymentEvent(
      page,
      'payment.processing',
      paymentId,
      orderId,
      42_500,
    )
    await sendPaymentEvent(page, 'payment.approved', paymentId, orderId, 42_500)

    await page.goto('/orders')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Meus pedidos' }),
    ).toBeVisible()
    await expect(page.getByText('Pagamento confirmado').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.goto(`/orders/${orderId}`)
    await expect(page.getByText('Pagamento confirmado').first()).toBeVisible()
    await expect(page.getByText(/R\$\s?425,00/).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('shows an understandable error for an out-of-stock variant', async ({
    page,
  }) => {
    await newCustomer(page)
    await page.goto(`/products/${seed.product.id}`)
    await page.getByRole('radio', { name: /16oz/ }).check()
    await page.getByLabel('Quantidade').fill('1')
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(page.getByRole('alert').first()).toContainText(/estoque/i)
  })

  test('sends anonymous visitors to the login page', async ({ page }) => {
    for (const path of ['/cart', '/checkout', '/orders']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
