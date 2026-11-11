import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Cart } from '../../src/modules/cart/domain/cart'
import type { OrderDetail } from '../../src/modules/orders/domain/order-query'
import {
  describeApiError,
  formatAttributes,
  formatCents,
  requestJson,
} from '../../src/modules/checkout/presentation/storefront'
import {
  AddToCartForm,
  variantLabel,
} from '../../src/modules/cart/presentation/add-to-cart-form'
import { CartContents } from '../../src/modules/cart/presentation/cart-view'
import {
  AddressForm,
  QuoteSummary,
  startAttempt,
  type Quote,
} from '../../src/modules/checkout/presentation/checkout-view'
import {
  PaymentPanel,
  PaymentSummary,
  paymentIdempotencyKey,
} from '../../src/modules/payments/presentation/payment-panel'
import {
  OrderDetailContents,
  OrderList,
} from '../../src/modules/orders/presentation/order-views'
import { ProductDetail } from '../../src/modules/catalog/presentation/product-detail'
import { CatalogBrowser } from '../../src/modules/catalog/presentation/catalog-browser'

const noop = () => undefined

const cart: Cart = {
  id: 'c0000000-0000-4000-8000-000000000001',
  items: [
    {
      id: 'i0000000-0000-4000-8000-000000000001',
      variantId: 'v0000000-0000-4000-8000-000000000001',
      productName: 'Luva de boxe',
      attributes: { size: 'M', color: 'Preto' },
      quantity: 2,
      unitPriceCents: 15000,
      subtotalCents: 30000,
      availableQuantity: 1,
      createdAt: '2026-11-11T10:00:00.000Z',
      updatedAt: '2026-11-11T10:00:00.000Z',
    },
  ],
  totalItems: 2,
  subtotalCents: 30000,
  // Valores deliberadamente diferentes de um cálculo local: a tela deve exibir o do servidor.
  discount: { source: 'COUPON', id: 'p1', label: 'TROPA10', amountCents: 3000 },
  totalCents: 27001,
  appliedCoupon: { id: 'k1', code: 'TROPA10' },
  createdAt: '2026-11-11T10:00:00.000Z',
  updatedAt: '2026-11-11T10:00:00.000Z',
} as Cart

const quote: Quote = {
  quoteId: 'q0000000-0000-4000-8000-000000000001',
  items: [
    {
      variantId: 'v1',
      productName: 'Luva de boxe',
      attributes: { size: 'M' },
      quantity: 2,
      unitPriceCents: 15000,
      subtotalCents: 30000,
    },
  ],
  subtotalCents: 30000,
  discount: null,
  discountCents: 0,
  shipping: {
    method: 'STANDARD',
    shippingCents: 2000,
    estimatedBusinessDays: 5,
    estimatedDeliveryDate: '2026-11-18',
  },
  totalCents: 32000,
  appliedCoupon: null,
}

const order: OrderDetail = {
  id: 'o0000000-0000-4000-8000-000000000001',
  status: 'PAYMENT_CONFIRMED',
  createdAt: '2026-11-11T10:00:00.000Z',
  updatedAt: '2026-11-11T10:05:00.000Z',
  paymentDueAt: '2026-12-11T10:00:00.000Z',
  subtotalCents: 30000,
  discountCents: 0,
  discountLabel: null,
  shippingCents: 2000,
  totalCents: 32000,
  currency: 'BRL',
  itemCount: 2,
  couponCode: null,
  payment: {
    status: 'APPROVED',
    method: 'PIX',
    amountCents: 32000,
    currency: 'BRL',
    paidAt: '2026-11-11T10:05:00.000Z',
  },
  shipment: {
    status: 'NOT_SHIPPED',
    method: 'STANDARD',
    shippingCents: 2000,
    estimatedBusinessDays: 5,
    estimatedDeliveryDate: '2026-11-18',
  },
  address: {
    recipientName: 'Maria Silva',
    postalCode: '01001000',
    street: 'Praça da Sé',
    number: '100',
    neighborhood: 'Sé',
    city: 'São Paulo',
    state: 'SP',
    country: 'BR',
  },
  items: [
    {
      id: 'it1',
      productName: 'Luva de boxe',
      attributes: { size: 'M' },
      unitPriceCents: 15000,
      quantity: 2,
      subtotalCents: 30000,
      discountCents: 0,
    },
  ],
  tracking: null,
}

const text = (html: string) => html.replace(/ /g, ' ')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('storefront helpers', () => {
  it('formats money, attributes and maps API errors to Portuguese messages', () => {
    expect(text(formatCents(32000))).toBe('R$ 320,00')
    expect(formatAttributes({ size: 'M', color: 'Preto' })).toBe(
      'Tamanho M · Cor Preto',
    )
    expect(
      describeApiError({ status: 409, code: 'STOCK_UNAVAILABLE' }),
    ).toMatch(/Estoque insuficiente/)
    expect(
      describeApiError({
        status: 409,
        message: 'Insufficient inventory for requested quantity.',
      }),
    ).toMatch(/Estoque insuficiente/)
    expect(describeApiError({ status: 404, code: 'COUPON_NOT_FOUND' })).toBe(
      'Cupom não encontrado.',
    )
    expect(describeApiError({ status: 409, code: 'COUPON_EXPIRED' })).toBe(
      'Este cupom expirou.',
    )
    expect(describeApiError({ status: 409, code: 'QUOTE_CHANGED' })).toMatch(
      /valores mudaram/,
    )
    expect(describeApiError({ status: 409, code: 'EXPIRED' })).toMatch(
      /expirou/,
    )
    expect(describeApiError({ status: 0 })).toMatch(/conectar/)
    expect(describeApiError({ status: 500 })).toMatch(/Tente novamente/)
  })

  it('redirects to login on 401 and reports the failure', async () => {
    const assign = vi.fn()
    vi.stubGlobal('window', { location: { assign } })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: 'Authentication required.' }, { status: 401 }),
      ),
    )
    const result = await requestJson('/api/cart')
    expect(result.ok).toBe(false)
    expect(result.status).toBe(401)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('returns status 0 on network failure so the caller can resend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network')
      }),
    )
    const result = await requestJson('/api/checkout/orders', { method: 'POST' })
    expect(result).toMatchObject({ ok: false, status: 0 })
  })

  it('exposes error code and message from failed responses', async () => {
    vi.stubGlobal('window', { location: { assign: vi.fn() } })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: 'Coupon expired.', code: 'COUPON_EXPIRED' },
          { status: 409 },
        ),
      ),
    )
    const result = await requestJson('/api/cart/coupon', {
      method: 'POST',
      json: { code: 'X' },
    })
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'COUPON_EXPIRED',
      message: 'Coupon expired.',
    })
  })
})

describe('idempotency keys', () => {
  it('creates a new order attempt key for each quote', () => {
    const first = startAttempt(quote)
    const second = startAttempt(quote)
    expect(first.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/)
    expect(first.idempotencyKey).not.toBe(second.idempotencyKey)
  })

  it('reuses the payment key for the same order and method', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    })
    const key = paymentIdempotencyKey('order-1', 'PIX')
    expect(paymentIdempotencyKey('order-1', 'PIX')).toBe(key)
    expect(paymentIdempotencyKey('order-1', 'CREDIT_CARD')).not.toBe(key)
  })

  it('still produces a key when session storage is unavailable', () => {
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
      },
    })
    expect(paymentIdempotencyKey('order-1', 'PIX')).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('customer screens', () => {
  it('renders the product page with labeled variant choices and add-to-cart', () => {
    const html = text(
      renderToStaticMarkup(
        createElement(ProductDetail, {
          product: {
            id: 'p1',
            name: 'Luva de boxe',
            description: 'Couro sintético',
            brand: { id: 'b1', name: 'Tropa' },
            categories: [{ id: 'c1', name: 'Luvas' }],
            publicationState: 'PUBLISHED',
            createdAt: '',
            updatedAt: '',
          },
          variants: [
            {
              id: 'v1',
              productId: 'p1',
              attributes: { size: 'M' },
              priceCents: 15000,
              currency: 'BRL',
              status: 'ACTIVE',
              createdAt: '',
              updatedAt: '',
              commerciallyAvailable: true,
            },
            {
              id: 'v2',
              productId: 'p1',
              attributes: { size: 'G' },
              priceCents: 16000,
              currency: 'BRL',
              status: 'ACTIVE',
              createdAt: '',
              updatedAt: '',
              commerciallyAvailable: true,
            },
          ],
        }),
      ),
    )
    expect(html).toContain('<h1 id="product-title"')
    expect(html).toContain('<legend>Variante</legend>')
    expect(html).toContain('Tamanho M — R$ 150,00')
    expect(html).toContain('A partir de R$ 150,00')
    expect(html).toContain('<label>Quantidade<input')
    expect(html).toContain('Adicionar ao carrinho')
  })

  it('shows a clear message when no variant can be bought', () => {
    const html = renderToStaticMarkup(
      createElement(AddToCartForm, { variants: [] }),
    )
    expect(html).toContain('Nenhuma variante disponível')
    expect(
      variantLabel({ id: 'v', attributes: {}, priceCents: 100 }),
    ).toContain('Variante única')
  })

  it('links catalog cards to the product page', () => {
    const html = renderToStaticMarkup(
      createElement(CatalogBrowser, {
        query: {},
        categories: [],
        brands: [],
        result: {
          items: [
            {
              id: 'p1',
              name: 'Luva de boxe',
              description: null,
              brand: { id: 'b1', name: 'Tropa' },
              categories: [],
              priceCents: 15000,
            },
          ],
          pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
        } as never,
      }),
    )
    expect(html).toContain('<a href="/products/p1">Luva de boxe</a>')
  })

  it('renders the cart with server totals, stock warning, quantity labels and coupon', () => {
    const html = text(
      renderToStaticMarkup(
        createElement(CartContents, {
          cart,
          busy: false,
          onUpdateQuantity: noop,
          onRemove: noop,
          onApplyCoupon: noop,
          onRemoveCoupon: noop,
        }),
      ),
    )
    expect(html).toContain('Quantidade de Luva de boxe')
    expect(html).toContain('Remover Luva de boxe')
    expect(html).toContain('Estoque disponível: 1')
    expect(html).toContain('Cupom aplicado: <strong>TROPA10</strong>')
    expect(html).toContain('Desconto (TROPA10)')
    expect(html).toContain('R$ 270,01')
    expect(html).toContain('href="/checkout"')
  })

  it('shows an empty-cart state and coupon removal notice', () => {
    expect(
      renderToStaticMarkup(
        createElement(CartContents, {
          cart: { ...cart, items: [] },
          busy: false,
          onUpdateQuantity: noop,
          onRemove: noop,
          onApplyCoupon: noop,
          onRemoveCoupon: noop,
        }),
      ),
    ).toContain('Seu carrinho está vazio.')
    expect(
      renderToStaticMarkup(
        createElement(CartContents, {
          cart: { ...cart, appliedCoupon: null, couponRemoved: true },
          busy: false,
          onUpdateQuantity: noop,
          onRemove: noop,
          onApplyCoupon: noop,
          onRemoveCoupon: noop,
        }),
      ),
    ).toContain('<label>Código do cupom')
  })

  it('renders a labeled Brazilian address form without hidden card fields', () => {
    const html = renderToStaticMarkup(
      createElement(AddressForm, { busy: false, onSubmit: noop }),
    )
    for (const field of ['CPF', 'Telefone com DDD', 'CEP', 'Rua', 'UF'])
      expect(html).toContain(`<label>${field}<input`)
    expect(html).not.toMatch(/card|cart[aã]o/i)
  })

  it('renders the quote with server shipping and total', () => {
    const html = text(
      renderToStaticMarkup(createElement(QuoteSummary, { quote })),
    )
    expect(html).toContain('<dt>Frete</dt><dd>R$ 20,00</dd>')
    expect(html).toContain('R$ 320,00')
    expect(html).toContain('5 dias')
    expect(html).toContain('18/11/2026')
  })

  it('offers simulated payment methods without asking for card data', () => {
    const html = renderToStaticMarkup(
      createElement(PaymentPanel, { orderId: order.id }),
    )
    expect(html).toContain('<legend>Meio de pagamento (simulado)</legend>')
    expect(html).toContain('PIX')
    expect(html).toContain('Cartão de crédito')
    expect(html).not.toMatch(/name="(card|number|cvv|cvc|holder)/i)
  })

  it('explains how to simulate approval after the payment is created', () => {
    const html = renderToStaticMarkup(
      createElement(PaymentSummary, {
        payment: {
          paymentId: 'pay-1',
          orderId: order.id,
          method: 'PIX',
          amountCents: 32000,
          currency: 'BRL',
          status: 'PENDING',
          createdAt: '',
          updatedAt: '',
          paidAt: null,
        },
      }),
    )
    expect(html).toContain('npm run payment:simulate -- pay-1 payment.approved')
    expect(html).toContain(`href="/orders/${order.id}"`)
  })

  it('renders order history with status labels and pagination', () => {
    const html = text(
      renderToStaticMarkup(
        createElement(OrderList, {
          result: { orders: [order], page: 1, pageSize: 1, total: 2 },
        }),
      ),
    )
    expect(html).toContain(`href="/orders/${order.id}"`)
    expect(html).toContain('Pagamento confirmado')
    expect(html).toContain('Total R$ 320,00')
    expect(html).toContain('aria-label="Paginação de pedidos"')
    expect(html).toContain('href="/orders?page=2"')
  })

  it('renders order detail with payment, shipment and no CPF or phone', () => {
    const html = text(
      renderToStaticMarkup(
        createElement(OrderDetailContents, {
          order,
          knownPaymentId: 'pay-1',
        }),
      ),
    )
    expect(html).toContain('Pagamento confirmado')
    expect(html).toContain('Aprovado (PIX)')
    expect(html).toContain('Não enviado · previsão 18/11/2026')
    expect(html).toContain('<code>pay-1</code>')
    expect(html).toContain('R$ 320,00')
    expect(html).not.toMatch(/CPF|Telefone/)
  })
})
