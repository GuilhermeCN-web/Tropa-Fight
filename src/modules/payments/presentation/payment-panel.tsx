'use client'

import { useState, type FormEvent } from 'react'
import {
  describeApiError,
  ErrorMessage,
  formatCents,
  label,
  newIdempotencyKey,
  paymentMethodLabel,
  paymentStatusLabel,
  readSession,
  requestJson,
  writeSession,
} from '../../checkout/presentation/storefront'

const methods = ['PIX', 'DEBIT_CARD', 'CREDIT_CARD'] as const
type Method = (typeof methods)[number]

export type PublicPayment = {
  paymentId: string
  orderId: string
  method: Method
  amountCents: number
  currency: 'BRL'
  status: string
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

export function paymentKeyStorageName(orderId: string, method: string) {
  return `tropa-fight:payment-key:${orderId}:${method}`
}

export function paymentIdStorageName(orderId: string) {
  return `tropa-fight:payment-id:${orderId}`
}

/**
 * Uma chave por pedido e meio de pagamento: reenviar a mesma escolha
 * (inclusive após recarregar a página) reutiliza a chave e devolve o
 * pagamento já criado, sem duplicá-lo.
 */
export function paymentIdempotencyKey(orderId: string, method: string) {
  const name = paymentKeyStorageName(orderId, method)
  const stored = readSession(name)
  if (stored) return stored
  const key = newIdempotencyKey()
  writeSession(name, key)
  return key
}

export function PaymentSummary({ payment }: { payment: PublicPayment }) {
  return (
    <div className="store-card" role="status">
      <h3 className="store-subtitle">Pagamento simulado criado</h3>
      <dl className="store-totals">
        <dt>Meio</dt>
        <dd>{label(paymentMethodLabel, payment.method)}</dd>
        <dt>Valor</dt>
        <dd>{formatCents(payment.amountCents)}</dd>
        <dt>Situação</dt>
        <dd>{label(paymentStatusLabel, payment.status)}</dd>
        <dt>Identificador</dt>
        <dd>
          <code>{payment.paymentId}</code>
        </dd>
      </dl>
      <p className="store-muted">
        Ambiente local: o pagamento é simulado e nenhum dado de cartão é
        solicitado. A confirmação chega pelo webhook do provedor simulado. Para
        demonstrá-la, execute no terminal:
      </p>
      <pre className="store-code">
        npm run payment:simulate -- {payment.paymentId} payment.processing
        {'\n'}npm run payment:simulate -- {payment.paymentId} payment.approved
      </pre>
      <p>
        <a href={`/orders/${payment.orderId}`}>Acompanhar o pedido</a>
      </p>
    </div>
  )
}

export function PaymentPanel({
  orderId,
  onCreated,
}: {
  orderId: string
  onCreated?: (payment: PublicPayment) => void
}) {
  const [method, setMethod] = useState<Method>('PIX')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [payment, setPayment] = useState<PublicPayment | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await requestJson<{ payment: PublicPayment }>(
      '/api/payments',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': paymentIdempotencyKey(orderId, method) },
        json: { orderId, method },
      },
    )
    setBusy(false)
    if (result.ok) {
      setPayment(result.data.payment)
      writeSession(paymentIdStorageName(orderId), result.data.payment.paymentId)
      onCreated?.(result.data.payment)
    } else if (result.status !== 401) {
      setError(describeApiError(result))
    }
  }

  if (payment) return <PaymentSummary payment={payment} />

  return (
    <form className="store-form" onSubmit={submit}>
      <fieldset>
        <legend>Meio de pagamento (simulado)</legend>
        {methods.map((item) => (
          <label key={item} className="store-choice">
            <input
              type="radio"
              name="method"
              value={item}
              checked={method === item}
              onChange={() => setMethod(item)}
            />
            {paymentMethodLabel[item]}
          </label>
        ))}
      </fieldset>
      <p className="store-muted">
        Nenhum dado de cartão é solicitado: o pagamento é processado pelo
        provedor simulado.
      </p>
      <button type="submit" disabled={busy}>
        {busy ? 'Criando pagamento…' : 'Pagar'}
      </button>
      <ErrorMessage message={error} />
    </form>
  )
}
