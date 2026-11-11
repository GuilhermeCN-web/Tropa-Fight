'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  OrderDetail,
  OrderListItem,
  OrderPageResult,
} from '../domain/order-query'
import { CartTotals } from '../../cart/presentation/cart-view'
import {
  PaymentPanel,
  paymentIdStorageName,
} from '../../payments/presentation/payment-panel'
import {
  type ApiResult,
  describeApiError,
  ErrorMessage,
  formatAttributes,
  formatCents,
  formatDate,
  formatDay,
  label,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  readSession,
  requestJson,
  shipmentStatusLabel,
} from '../../checkout/presentation/storefront'

export function OrderList({
  result,
}: {
  result: Pick<OrderPageResult, 'orders' | 'page' | 'pageSize' | 'total'>
}) {
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  if (result.orders.length === 0)
    return (
      <p className="store-muted">
        Você ainda não fez pedidos. <a href="/catalog">Explorar catálogo</a>
      </p>
    )
  return (
    <>
      <ul className="store-list" aria-label="Pedidos">
        {result.orders.map((order: OrderListItem) => (
          <li key={order.id} className="store-card store-line">
            <h2 className="store-subtitle">
              <a href={`/orders/${order.id}`}>
                Pedido de {formatDate(order.createdAt)}
              </a>
            </h2>
            <p>
              Situação: <strong>{label(orderStatusLabel, order.status)}</strong>
            </p>
            <p>
              {order.itemCount === 1 ? '1 item' : `${order.itemCount} itens`} ·
              Total {formatCents(order.totalCents)}
            </p>
            {order.payment ? (
              <p className="store-muted">
                Pagamento: {label(paymentStatusLabel, order.payment.status)}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <nav className="catalog-pagination" aria-label="Paginação de pedidos">
          {result.page > 1 ? (
            <a href={`/orders?page=${result.page - 1}`} rel="prev">
              Página anterior
            </a>
          ) : (
            <span aria-disabled="true">Página anterior</span>
          )}
          <span aria-current="page">
            Página {result.page} de {totalPages}
          </span>
          {result.page < totalPages ? (
            <a href={`/orders?page=${result.page + 1}`} rel="next">
              Próxima página
            </a>
          ) : (
            <span aria-disabled="true">Próxima página</span>
          )}
        </nav>
      ) : null}
    </>
  )
}

export function OrderListView({ page }: { page: number }) {
  const [result, setResult] = useState<OrderPageResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void requestJson<OrderPageResult>(`/api/orders?page=${page}`).then(
      (response) => {
        if (response.ok) setResult(response.data)
        else if (response.status !== 401) setError(describeApiError(response))
      },
    )
  }, [page])

  return (
    <main className="store-shell">
      <h1 className="store-title">Meus pedidos</h1>
      <ErrorMessage message={error} />
      {!result && !error ? <p role="status">Carregando pedidos…</p> : null}
      {result ? <OrderList result={result} /> : null}
    </main>
  )
}

export function OrderDetailContents({
  order,
  knownPaymentId,
}: {
  order: OrderDetail
  knownPaymentId?: string | null
}) {
  return (
    <>
      <section className="store-card" aria-labelledby="order-status-title">
        <h2 id="order-status-title" className="store-subtitle">
          Situação
        </h2>
        <dl className="store-totals">
          <dt>Pedido</dt>
          <dd>
            <strong>{label(orderStatusLabel, order.status)}</strong>
          </dd>
          <dt>Criado em</dt>
          <dd>{formatDate(order.createdAt)}</dd>
          {order.status === 'PENDING_PAYMENT' ? (
            <>
              <dt>Pagar até</dt>
              <dd>{formatDate(order.paymentDueAt)}</dd>
            </>
          ) : null}
          <dt>Pagamento</dt>
          <dd>
            {order.payment
              ? `${label(paymentStatusLabel, order.payment.status)} (${label(
                  paymentMethodLabel,
                  order.payment.method,
                )})`
              : 'Não iniciado'}
          </dd>
          {order.payment && knownPaymentId ? (
            <>
              <dt>Identificador do pagamento</dt>
              <dd>
                <code>{knownPaymentId}</code>
              </dd>
            </>
          ) : null}
          <dt>Entrega</dt>
          <dd>
            {order.shipment
              ? `${label(shipmentStatusLabel, order.shipment.status)} · previsão ${formatDay(
                  order.shipment.estimatedDeliveryDate,
                )}`
              : 'Sem informações'}
          </dd>
        </dl>
      </section>

      <section className="store-card" aria-labelledby="order-items-title">
        <h2 id="order-items-title" className="store-subtitle">
          Itens
        </h2>
        <ul className="store-list">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.productName}
              {formatAttributes(item.attributes)
                ? ` (${formatAttributes(item.attributes)})`
                : ''}{' '}
              — {item.quantity} × {formatCents(item.unitPriceCents)} ={' '}
              {formatCents(item.subtotalCents)}
            </li>
          ))}
        </ul>
        {order.couponCode ? (
          <p className="store-muted">Cupom: {order.couponCode}</p>
        ) : null}
        <CartTotals
          subtotalCents={order.subtotalCents}
          discount={
            order.discountCents > 0
              ? {
                  label: order.discountLabel ?? 'desconto',
                  amountCents: order.discountCents,
                }
              : null
          }
          shippingCents={order.shippingCents}
          totalCents={order.totalCents}
        />
      </section>

      <section className="store-card" aria-labelledby="order-address-title">
        <h2 id="order-address-title" className="store-subtitle">
          Endereço de entrega
        </h2>
        <address className="store-address">
          {order.address.recipientName}
          <br />
          {order.address.street}, {order.address.number}
          {order.address.complement ? ` — ${order.address.complement}` : ''}
          <br />
          {order.address.neighborhood} — {order.address.city}/
          {order.address.state}
          <br />
          CEP {order.address.postalCode}
        </address>
      </section>
    </>
  )
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const url = `/api/orders/${encodeURIComponent(orderId)}`
  const apply = useCallback(
    (result: ApiResult<{ order: OrderDetail }>) => {
      setLoading(false)
      if (result.ok) {
        setError('')
        setOrder(result.data.order)
      } else if (result.status === 404) setError('Pedido não encontrado.')
      else if (result.status !== 401) setError(describeApiError(result))
      setPaymentId(readSession(paymentIdStorageName(orderId)))
    },
    [orderId],
  )

  function load() {
    setLoading(true)
    void requestJson<{ order: OrderDetail }>(url).then(apply)
  }

  useEffect(() => {
    void requestJson<{ order: OrderDetail }>(url).then(apply)
  }, [url, apply])

  return (
    <main className="store-shell">
      <p>
        <a href="/orders">← Meus pedidos</a>
      </p>
      <h1 className="store-title">Pedido</h1>
      <ErrorMessage message={error} />
      {loading && !order ? <p role="status">Carregando pedido…</p> : null}
      {order ? (
        <>
          <OrderDetailContents order={order} knownPaymentId={paymentId} />
          {order.status === 'PENDING_PAYMENT' && !order.payment ? (
            <section className="store-card" aria-labelledby="pay-title">
              <h2 id="pay-title" className="store-subtitle">
                Pagamento
              </h2>
              <PaymentPanel
                orderId={order.id}
                onCreated={(payment) => setPaymentId(payment.paymentId)}
              />
            </section>
          ) : null}
          <button
            type="button"
            className="store-secondary"
            disabled={loading}
            onClick={load}
          >
            Atualizar situação
          </button>
        </>
      ) : null}
    </main>
  )
}
