'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { Cart } from '../domain/cart'
import {
  describeApiError,
  ErrorMessage,
  formatAttributes,
  formatCents,
  requestJson,
} from '../../checkout/presentation/storefront'

type CartContentsProps = {
  cart: Cart
  busy: boolean
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
}

export function CartTotals({
  subtotalCents,
  discount,
  totalCents,
  shippingCents,
}: {
  subtotalCents: number
  discount: { label: string; amountCents: number } | null
  totalCents: number
  shippingCents?: number
}) {
  return (
    <dl className="store-totals">
      <dt>Subtotal</dt>
      <dd>{formatCents(subtotalCents)}</dd>
      {discount && discount.amountCents > 0 ? (
        <>
          <dt>Desconto ({discount.label})</dt>
          <dd>− {formatCents(discount.amountCents)}</dd>
        </>
      ) : null}
      {shippingCents !== undefined ? (
        <>
          <dt>Frete</dt>
          <dd>{formatCents(shippingCents)}</dd>
        </>
      ) : null}
      <dt className="store-total-label">Total</dt>
      <dd className="store-total-value">{formatCents(totalCents)}</dd>
    </dl>
  )
}

function QuantityForm({
  itemId,
  productName,
  quantity,
  busy,
  onSubmit,
}: {
  itemId: string
  productName: string
  quantity: number
  busy: boolean
  onSubmit: (itemId: string, quantity: number) => void
}) {
  const [value, setValue] = useState(String(quantity))
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Number(value)
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      setError('Informe uma quantidade inteira maior que zero.')
      return
    }
    setError('')
    onSubmit(itemId, parsed)
  }

  return (
    <form className="store-inline-form" onSubmit={submit} noValidate>
      <label>
        Quantidade de {productName}
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button type="submit" disabled={busy}>
        Atualizar
      </button>
      <ErrorMessage message={error} />
    </form>
  )
}

export function CartContents({
  cart,
  busy,
  onUpdateQuantity,
  onRemove,
  onApplyCoupon,
  onRemoveCoupon,
}: CartContentsProps) {
  const [code, setCode] = useState('')

  if (cart.items.length === 0)
    return (
      <p className="store-muted">
        Seu carrinho está vazio. <a href="/catalog">Explorar catálogo</a>
      </p>
    )

  return (
    <>
      {cart.couponRemoved ? (
        <p className="store-alert" role="status">
          O cupom aplicado deixou de ser válido e foi removido do carrinho.
        </p>
      ) : null}
      <ul className="store-list" aria-label="Itens do carrinho">
        {cart.items.map((item) => (
          <li key={item.id} className="store-card store-line">
            <h2 className="store-subtitle">{item.productName}</h2>
            {formatAttributes(item.attributes) ? (
              <p className="store-muted">{formatAttributes(item.attributes)}</p>
            ) : null}
            <p>
              {item.quantity} × {formatCents(item.unitPriceCents)} ={' '}
              <strong>{formatCents(item.subtotalCents)}</strong>
            </p>
            {item.quantity > item.availableQuantity ? (
              <p className="store-alert" role="status">
                Estoque disponível: {item.availableQuantity}. Ajuste a
                quantidade para continuar.
              </p>
            ) : null}
            <QuantityForm
              key={`${item.id}-${item.quantity}`}
              itemId={item.id}
              productName={item.productName}
              quantity={item.quantity}
              busy={busy}
              onSubmit={onUpdateQuantity}
            />
            <button
              type="button"
              className="store-secondary"
              disabled={busy}
              onClick={() => onRemove(item.id)}
            >
              Remover {item.productName}
            </button>
          </li>
        ))}
      </ul>

      <section className="store-card" aria-labelledby="coupon-title">
        <h2 id="coupon-title" className="store-subtitle">
          Cupom
        </h2>
        {cart.appliedCoupon ? (
          <p>
            Cupom aplicado: <strong>{cart.appliedCoupon.code}</strong>{' '}
            <button
              type="button"
              className="store-secondary"
              disabled={busy}
              onClick={onRemoveCoupon}
            >
              Remover cupom
            </button>
          </p>
        ) : (
          <form
            className="store-inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (code.trim()) onApplyCoupon(code.trim())
            }}
          >
            <label>
              Código do cupom
              <input
                name="code"
                autoComplete="off"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <button type="submit" disabled={busy || !code.trim()}>
              Aplicar
            </button>
          </form>
        )}
      </section>

      <section className="store-card" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title" className="store-subtitle">
          Resumo
        </h2>
        <CartTotals
          subtotalCents={cart.subtotalCents}
          discount={cart.discount}
          totalCents={cart.totalCents}
        />
        <p className="store-muted">
          O frete é calculado no checkout a partir do endereço de entrega.
        </p>
        <a className="store-button" href="/checkout">
          Ir para o checkout
        </a>
      </section>
    </>
  )
}

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void requestJson<{ cart: Cart }>('/api/cart').then((result) => {
      setLoading(false)
      if (result.ok) setCart(result.data.cart)
      else if (result.status !== 401) setError(describeApiError(result))
    })
  }, [])

  async function mutate(url: string, init: Parameters<typeof requestJson>[1]) {
    setBusy(true)
    setError('')
    const result = await requestJson<{ cart: Cart }>(url, init)
    setBusy(false)
    if (result.ok) setCart(result.data.cart)
    else if (result.status !== 401) setError(describeApiError(result))
  }

  return (
    <main className="store-shell">
      <h1 className="store-title">Carrinho</h1>
      <ErrorMessage message={error} />
      {loading ? <p role="status">Carregando carrinho…</p> : null}
      {cart ? (
        <CartContents
          cart={cart}
          busy={busy}
          onUpdateQuantity={(itemId, quantity) =>
            void mutate(`/api/cart/items/${itemId}`, {
              method: 'PATCH',
              json: { quantity },
            })
          }
          onRemove={(itemId) =>
            void mutate(`/api/cart/items/${itemId}`, { method: 'DELETE' })
          }
          onApplyCoupon={(code) =>
            void mutate('/api/cart/coupon', { method: 'POST', json: { code } })
          }
          onRemoveCoupon={() =>
            void mutate('/api/cart/coupon', { method: 'DELETE' })
          }
        />
      ) : null}
    </main>
  )
}
