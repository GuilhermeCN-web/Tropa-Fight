'use client'

import { useState, type FormEvent } from 'react'
import {
  describeApiError,
  ErrorMessage,
  formatAttributes,
  formatCents,
  requestJson,
} from '../../checkout/presentation/storefront'

export type VariantOption = {
  id: string
  attributes: Record<string, unknown>
  priceCents: number
}

export function variantLabel(variant: VariantOption): string {
  const attributes = formatAttributes(variant.attributes)
  return `${attributes || 'Variante única'} — ${formatCents(variant.priceCents)}`
}

export function AddToCartForm({ variants }: { variants: VariantOption[] }) {
  const [variantId, setVariantId] = useState(
    variants.length === 1 ? variants[0]!.id : '',
  )
  const [quantity, setQuantity] = useState('1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  if (variants.length === 0)
    return (
      <p className="store-muted">
        Nenhuma variante disponível para compra no momento.
      </p>
    )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setAdded(false)
    const parsedQuantity = Number(quantity)
    if (!variantId) {
      setError('Selecione uma variante.')
      return
    }
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('Informe uma quantidade inteira maior que zero.')
      return
    }
    setBusy(true)
    const result = await requestJson('/api/cart', {
      method: 'POST',
      json: { variantId, quantity: parsedQuantity },
    })
    setBusy(false)
    if (result.ok) setAdded(true)
    else if (result.status !== 401) setError(describeApiError(result))
  }

  return (
    <form className="store-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>Variante</legend>
        {variants.map((variant) => (
          <label key={variant.id} className="store-choice">
            <input
              type="radio"
              name="variantId"
              value={variant.id}
              checked={variantId === variant.id}
              onChange={() => setVariantId(variant.id)}
              required
            />
            {variantLabel(variant)}
          </label>
        ))}
      </fieldset>
      <label>
        Quantidade
        <input
          type="number"
          name="quantity"
          min="1"
          step="1"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? 'Adicionando…' : 'Adicionar ao carrinho'}
      </button>
      <ErrorMessage message={error} />
      {added ? (
        <p className="store-success" role="status">
          Item adicionado ao carrinho. <a href="/cart">Ver carrinho</a>
        </p>
      ) : null}
    </form>
  )
}
