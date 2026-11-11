'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { Address } from '../domain/checkout'
import { CartTotals } from '../../cart/presentation/cart-view'
import { PaymentPanel } from '../../payments/presentation/payment-panel'
import {
  describeApiError,
  ErrorMessage,
  formatAttributes,
  formatCents,
  formatDay,
  label,
  newIdempotencyKey,
  orderStatusLabel,
  requestJson,
} from './storefront'

export type Quote = {
  quoteId: string
  items: Array<{
    variantId: string
    productName: string
    attributes: Record<string, unknown>
    quantity: number
    unitPriceCents: number
    subtotalCents: number
  }>
  subtotalCents: number
  discount: { label: string; amountCents: number } | null
  discountCents: number
  shipping: {
    method: string
    shippingCents: number
    estimatedBusinessDays: number
    estimatedDeliveryDate: string
  }
  totalCents: number
  appliedCoupon: { code: string } | null
}

export type CreatedOrder = {
  orderId: string
  status: string
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
  paymentDueAt: string
  createdAt: string
}

/** Uma tentativa de criação de pedido: a cotação e a chave de idempotência. */
export type OrderAttempt = { quote: Quote; idempotencyKey: string }

export function startAttempt(quote: Quote): OrderAttempt {
  return { quote, idempotencyKey: newIdempotencyKey() }
}

export function addressSummary(address: Address): string {
  return `${address.street}, ${address.number}${
    address.complement ? ` (${address.complement})` : ''
  } — ${address.neighborhood}, ${address.city}/${address.state} — CEP ${
    address.postalCode
  }`
}

const addressFields: Array<{
  name: string
  label: string
  autoComplete?: string
  required: boolean
  inputMode?: 'numeric' | 'tel'
  maxLength?: number
}> = [
  {
    name: 'recipientName',
    label: 'Nome do destinatário',
    autoComplete: 'name',
    required: true,
  },
  { name: 'cpf', label: 'CPF', inputMode: 'numeric', required: true },
  {
    name: 'phone',
    label: 'Telefone com DDD',
    autoComplete: 'tel-national',
    inputMode: 'tel',
    required: true,
  },
  {
    name: 'postalCode',
    label: 'CEP',
    autoComplete: 'postal-code',
    inputMode: 'numeric',
    required: true,
  },
  {
    name: 'street',
    label: 'Rua',
    autoComplete: 'address-line1',
    required: true,
  },
  { name: 'number', label: 'Número', required: true },
  {
    name: 'complement',
    label: 'Complemento (opcional)',
    autoComplete: 'address-line2',
    required: false,
  },
  { name: 'neighborhood', label: 'Bairro', required: true },
  {
    name: 'city',
    label: 'Cidade',
    autoComplete: 'address-level2',
    required: true,
  },
  {
    name: 'state',
    label: 'UF',
    autoComplete: 'address-level1',
    required: true,
    maxLength: 2,
  },
  {
    name: 'reference',
    label: 'Ponto de referência (opcional)',
    required: false,
  },
]

export function AddressForm({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: (values: Record<string, string>) => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values: Record<string, string> = { country: 'BR' }
    for (const field of addressFields) {
      const value = form.get(field.name)
      if (typeof value === 'string' && value.trim())
        values[field.name] = value.trim()
    }
    onSubmit(values)
  }

  return (
    <form className="store-form" onSubmit={submit}>
      <fieldset>
        <legend>Novo endereço de entrega (somente Brasil)</legend>
        {addressFields.map((field) => (
          <label key={field.name}>
            {field.label}
            <input
              name={field.name}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              maxLength={field.maxLength}
              required={field.required}
            />
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={busy}>
        Salvar endereço
      </button>
    </form>
  )
}

export function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <section className="store-card" aria-labelledby="quote-title">
      <h2 id="quote-title" className="store-subtitle">
        Cotação
      </h2>
      <ul className="store-list" aria-label="Itens da cotação">
        {quote.items.map((item) => (
          <li key={item.variantId}>
            {item.productName}
            {formatAttributes(item.attributes)
              ? ` (${formatAttributes(item.attributes)})`
              : ''}{' '}
            — {item.quantity} × {formatCents(item.unitPriceCents)} ={' '}
            {formatCents(item.subtotalCents)}
          </li>
        ))}
      </ul>
      {quote.appliedCoupon ? (
        <p className="store-muted">Cupom: {quote.appliedCoupon.code}</p>
      ) : null}
      <CartTotals
        subtotalCents={quote.subtotalCents}
        discount={quote.discount}
        shippingCents={quote.shipping.shippingCents}
        totalCents={quote.totalCents}
      />
      <p className="store-muted">
        Entrega padrão em até {quote.shipping.estimatedBusinessDays} dias úteis.
        Previsão: {formatDay(quote.shipping.estimatedDeliveryDate)}.
      </p>
    </section>
  )
}

export function OrderCreated({ order }: { order: CreatedOrder }) {
  return (
    <section className="store-card" aria-labelledby="order-created-title">
      <h2 id="order-created-title" className="store-subtitle">
        Pedido criado
      </h2>
      <p role="status">
        Situação: <strong>{label(orderStatusLabel, order.status)}</strong>.
        Total: <strong>{formatCents(order.totalCents)}</strong>.
      </p>
      <p className="store-muted">
        Pague até {formatDay(order.paymentDueAt)}. Depois disso, o pedido expira
        e os itens voltam ao estoque.
      </p>
      <p>
        <a href={`/orders/${order.orderId}`}>Ver detalhes do pedido</a>
      </p>
    </section>
  )
}

export function CheckoutView() {
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [addressId, setAddressId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [attempt, setAttempt] = useState<OrderAttempt | null>(null)
  const [quoteChanged, setQuoteChanged] = useState(false)
  const [order, setOrder] = useState<CreatedOrder | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void requestJson<{ addresses: Address[] }>('/api/addresses').then(
      (result) => {
        if (result.ok) {
          setAddresses(result.data.addresses)
          setShowForm(result.data.addresses.length === 0)
          if (result.data.addresses[0])
            setAddressId(result.data.addresses[0].id)
        } else if (result.status !== 401) setError(describeApiError(result))
      },
    )
  }, [])

  async function createAddress(values: Record<string, string>) {
    setBusy(true)
    setError('')
    const result = await requestJson<{ address: Address }>('/api/addresses', {
      method: 'POST',
      json: values,
    })
    setBusy(false)
    if (result.ok) {
      setAddresses((current) => [...(current ?? []), result.data.address])
      setAddressId(result.data.address.id)
      setShowForm(false)
      setAttempt(null)
    } else if (result.status !== 401) setError(describeApiError(result))
  }

  async function requestQuote() {
    if (!addressId) {
      setError('Selecione ou cadastre um endereço de entrega.')
      return
    }
    setBusy(true)
    setError('')
    setQuoteChanged(false)
    const result = await requestJson<{ quote: Quote }>('/api/checkout/quotes', {
      method: 'POST',
      json: { addressId },
    })
    setBusy(false)
    if (result.ok) setAttempt(startAttempt(result.data.quote))
    else if (result.status !== 401) setError(describeApiError(result))
  }

  async function confirmOrder() {
    if (!attempt) return
    setBusy(true)
    setError('')
    // A mesma chave é reutilizada em qualquer reenvio desta tentativa.
    const result = await requestJson<{ order: CreatedOrder }>(
      '/api/checkout/orders',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': attempt.idempotencyKey },
        json: { quoteId: attempt.quote.quoteId },
      },
    )
    setBusy(false)
    if (result.ok) {
      setOrder(result.data.order)
      return
    }
    if (result.status === 401) return
    const body = result.body as { code?: string; quote?: Quote } | null
    if (result.status === 409 && body?.code === 'QUOTE_CHANGED' && body.quote) {
      // Nova cotação = nova tentativa, que exige nova confirmação.
      setAttempt(startAttempt(body.quote))
      setQuoteChanged(true)
    }
    setError(describeApiError(result))
  }

  if (order)
    return (
      <main className="store-shell">
        <h1 className="store-title">Checkout</h1>
        <OrderCreated order={order} />
        <section className="store-card" aria-labelledby="payment-title">
          <h2 id="payment-title" className="store-subtitle">
            Pagamento
          </h2>
          <PaymentPanel orderId={order.orderId} />
        </section>
      </main>
    )

  return (
    <main className="store-shell">
      <h1 className="store-title">Checkout</h1>
      <p>
        <a href="/cart">← Voltar ao carrinho</a>
      </p>
      <ErrorMessage message={error} />

      <section className="store-card" aria-labelledby="address-title">
        <h2 id="address-title" className="store-subtitle">
          Endereço de entrega
        </h2>
        {addresses === null && !error ? (
          <p role="status">Carregando endereços…</p>
        ) : null}
        {addresses && addresses.length > 0 ? (
          <fieldset>
            <legend>Escolha o endereço</legend>
            {addresses.map((address) => (
              <label key={address.id} className="store-choice">
                <input
                  type="radio"
                  name="addressId"
                  value={address.id}
                  checked={addressId === address.id}
                  onChange={() => {
                    setAddressId(address.id)
                    setAttempt(null)
                  }}
                />
                <span>
                  <strong>{address.recipientName}</strong> —{' '}
                  {addressSummary(address)}
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}
        {showForm ? (
          <AddressForm busy={busy} onSubmit={createAddress} />
        ) : addresses ? (
          <button
            type="button"
            className="store-secondary"
            onClick={() => setShowForm(true)}
          >
            Cadastrar novo endereço
          </button>
        ) : null}
      </section>

      <section className="store-card" aria-labelledby="quote-step-title">
        <h2 id="quote-step-title" className="store-subtitle">
          Revisão
        </h2>
        <button
          type="button"
          disabled={busy || !addressId}
          onClick={() => void requestQuote()}
        >
          {attempt ? 'Atualizar cotação' : 'Calcular frete e total'}
        </button>
      </section>

      {attempt ? (
        <>
          {quoteChanged ? (
            <p className="store-alert" role="status">
              Os valores foram atualizados pelo servidor. Revise a nova cotação
              antes de confirmar.
            </p>
          ) : null}
          <QuoteSummary quote={attempt.quote} />
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmOrder()}
          >
            {busy
              ? 'Confirmando…'
              : `Confirmar pedido de ${formatCents(attempt.quote.totalCents)}`}
          </button>
        </>
      ) : null}
    </main>
  )
}
