import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import {
  canTransitionPayment,
  isTerminalPaymentStatus,
  PaymentError,
  statusForPaymentEvent,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentWebhookEvent,
} from '../domain/payment'
import type {
  PaymentCreationResult,
  PaymentRepository,
  PayableOrder,
  WebhookProcessingResult,
} from '../application/payment-ports'

type PaymentRow = {
  id: string
  order_id: string
  provider: 'LOCAL_MOCK'
  provider_payment_id: string
  method: PaymentMethod
  amount_cents: string
  currency: 'BRL'
  status: PaymentStatus
  idempotency_key: string
  created_at: Date
  updated_at: Date
  paid_at: Date | null
}

function toPayment(row: PaymentRow): Payment {
  const amountCents = Number(row.amount_cents)
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('Stored payment amount is outside the supported range.')
  }
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    method: row.method,
    amountCents,
    currency: row.currency,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    paidAt: row.paid_at?.toISOString() ?? null,
  }
}

async function transaction<T>(
  pool: Pool,
  action: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await action(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function paymentByKey(
  client: PoolClient,
  customerId: string,
  idempotencyKey: string,
  lock = false,
) {
  const result = await client.query<PaymentRow>(
    `SELECT id,order_id,provider,provider_payment_id,method,amount_cents::text,
            currency,status,idempotency_key,created_at,updated_at,paid_at
       FROM payments
      WHERE customer_id=$1 AND idempotency_key=$2${lock ? ' FOR UPDATE' : ''}`,
    [customerId, idempotencyKey],
  )
  return result.rows[0] ? toPayment(result.rows[0]) : null
}

async function paymentByOrder(
  client: PoolClient,
  orderId: string,
  lock = false,
) {
  const result = await client.query<PaymentRow>(
    `SELECT id,order_id,provider,provider_payment_id,method,amount_cents::text,
            currency,status,idempotency_key,created_at,updated_at,paid_at
       FROM payments
      WHERE order_id=$1${lock ? ' FOR UPDATE' : ''}`,
    [orderId],
  )
  return result.rows[0] ? toPayment(result.rows[0]) : null
}

async function auditPayment(
  client: PoolClient,
  input: {
    actorId: string | null
    action:
      'PAYMENT_CREATED' | 'PAYMENT_STATUS_CHANGED' | 'ORDER_PAYMENT_CONFIRMED'
    resourceType: 'Payment' | 'Order'
    resourceId: string
    result: 'SUCCESS' | 'FAILURE'
    source: string
    reasonCode?: string
  },
) {
  await insertAuditEvent(
    client,
    createAuditEvent({
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      result: input.result,
      source: input.source,
      ...(input.reasonCode
        ? { metadata: { reasonCode: input.reasonCode } }
        : {}),
    }),
  )
}

export class PostgresPaymentRepository implements PaymentRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async findByIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
  ): Promise<Payment | null> {
    const result = await this.pool.query<PaymentRow>(
      `SELECT id,order_id,provider,provider_payment_id,method,amount_cents::text,
              currency,status,idempotency_key,created_at,updated_at,paid_at
         FROM payments
        WHERE customer_id=$1 AND idempotency_key=$2`,
      [customerId, idempotencyKey],
    )
    return result.rows[0] ? toPayment(result.rows[0]) : null
  }

  async getPayableOrder(
    customerId: string,
    orderId: string,
  ): Promise<PayableOrder> {
    const result = await this.pool.query<{
      status: string
      amount_cents: string
      payment_due_at: Date
    }>(
      `SELECT status,total_cents::text AS amount_cents,payment_due_at
         FROM orders
        WHERE id=$1 AND customer_id=$2`,
      [orderId, customerId],
    )
    const order = result.rows[0]
    if (!order) throw new PaymentError('Order not found.', 'NOT_FOUND')
    if (order.status !== 'PENDING_PAYMENT')
      throw new PaymentError('Order is not awaiting payment.', 'CONFLICT')
    if (order.payment_due_at.getTime() <= Date.now())
      throw new PaymentError('Order payment deadline has expired.', 'EXPIRED')
    const amountCents = Number(order.amount_cents)
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0)
      throw new Error('Stored order total is outside the supported range.')
    return { amountCents, currency: 'BRL' }
  }

  async createPayment(input: {
    customerId: string
    orderId: string
    method: PaymentMethod
    amountCents: number
    currency: 'BRL'
    idempotencyKey: string
    providerPaymentId: string
  }): Promise<PaymentCreationResult> {
    return transaction(this.pool, async (client) => {
      const orderResult = await client.query<{
        status: string
        amount_cents: string
        payment_due_at: Date
      }>(
        `SELECT status,total_cents::text AS amount_cents,payment_due_at
           FROM orders
          WHERE id=$1 AND customer_id=$2
          FOR UPDATE`,
        [input.orderId, input.customerId],
      )
      const order = orderResult.rows[0]
      if (!order) throw new PaymentError('Order not found.', 'NOT_FOUND')

      const priorKey = await paymentByKey(
        client,
        input.customerId,
        input.idempotencyKey,
        true,
      )
      if (priorKey) {
        if (
          priorKey.orderId !== input.orderId ||
          priorKey.method !== input.method
        )
          throw new PaymentError(
            'Idempotency key was already used for a different payment request.',
            'CONFLICT',
          )
        return { payment: priorKey, created: false }
      }

      if (order.status !== 'PENDING_PAYMENT')
        throw new PaymentError('Order is not awaiting payment.', 'CONFLICT')
      if (order.payment_due_at.getTime() <= Date.now())
        throw new PaymentError('Order payment deadline has expired.', 'EXPIRED')

      const amountCents = Number(order.amount_cents)
      if (
        !Number.isSafeInteger(amountCents) ||
        amountCents <= 0 ||
        amountCents !== input.amountCents ||
        input.currency !== 'BRL'
      )
        throw new PaymentError(
          'Payment amount does not match the order.',
          'CONFLICT',
        )

      if (await paymentByOrder(client, input.orderId, true)) {
        throw new PaymentError(
          'A payment already exists for this order.',
          'CONFLICT',
        )
      }

      const paymentId = randomUUID()
      const inserted = await client.query<PaymentRow>(
        `INSERT INTO payments
          (id,order_id,customer_id,provider,provider_payment_id,method,
           amount_cents,currency,status,idempotency_key)
         VALUES ($1,$2,$3,'LOCAL_MOCK',$4,$5,$6,'BRL','PENDING',$7)
         ON CONFLICT DO NOTHING
         RETURNING id,order_id,provider,provider_payment_id,method,
                   amount_cents::text,currency,status,idempotency_key,
                   created_at,updated_at,paid_at`,
        [
          paymentId,
          input.orderId,
          input.customerId,
          input.providerPaymentId,
          input.method,
          amountCents,
          input.idempotencyKey,
        ],
      )
      if (!inserted.rowCount) {
        const concurrentKey = await paymentByKey(
          client,
          input.customerId,
          input.idempotencyKey,
          true,
        )
        if (concurrentKey) {
          if (
            concurrentKey.orderId !== input.orderId ||
            concurrentKey.method !== input.method
          )
            throw new PaymentError(
              'Idempotency key was already used for a different payment request.',
              'CONFLICT',
            )
          return { payment: concurrentKey, created: false }
        }
        throw new PaymentError(
          'A payment already exists for this order or idempotency key.',
          'CONFLICT',
        )
      }

      const payment = toPayment(inserted.rows[0]!)
      await auditPayment(client, {
        actorId: input.customerId,
        action: 'PAYMENT_CREATED',
        resourceType: 'Payment',
        resourceId: payment.id,
        result: 'SUCCESS',
        source: 'payments.create',
      })
      return { payment, created: true }
    })
  }

  async getPayment(
    customerId: string,
    paymentId: string,
  ): Promise<Payment | null> {
    const result = await this.pool.query<PaymentRow>(
      `SELECT id,order_id,provider,provider_payment_id,method,amount_cents::text,
              currency,status,idempotency_key,created_at,updated_at,paid_at
         FROM payments
        WHERE id=$1 AND customer_id=$2`,
      [paymentId, customerId],
    )
    return result.rows[0] ? toPayment(result.rows[0]) : null
  }

  async processWebhook(
    event: PaymentWebhookEvent,
  ): Promise<WebhookProcessingResult> {
    return transaction(this.pool, async (client) => {
      const received = await client.query<{ id: string }>(
        `INSERT INTO payment_webhook_events
          (id,provider,provider_event_id,event_type,status)
         VALUES ($1,'LOCAL_MOCK',$2,$3,'RECEIVED')
         ON CONFLICT (provider,provider_event_id) DO NOTHING
         RETURNING id`,
        [randomUUID(), event.id, event.type],
      )
      const webhookEventId = received.rows[0]?.id
      if (!webhookEventId) return { kind: 'duplicate' }

      const reference = await client.query<{ order_id: string }>(
        'SELECT order_id FROM payments WHERE id=$1',
        [event.paymentId],
      )
      if (!reference.rowCount) {
        await this.rejectWebhook(
          client,
          webhookEventId,
          null,
          'PAYMENT_NOT_FOUND',
        )
        return { kind: 'rejected', reason: 'PAYMENT_NOT_FOUND' }
      }

      const orderResult = await client.query<{
        id: string
        customer_id: string
        status: string
        total_cents: string
        payment_due_at: Date
      }>(
        `SELECT id,customer_id,status,total_cents::text,payment_due_at
           FROM orders
          WHERE id=$1
          FOR UPDATE`,
        [reference.rows[0]!.order_id],
      )
      const order = orderResult.rows[0]
      const paymentResult = await client.query<PaymentRow>(
        `SELECT id,order_id,provider,provider_payment_id,method,
                amount_cents::text,currency,status,idempotency_key,
                created_at,updated_at,paid_at
           FROM payments
          WHERE id=$1
          FOR UPDATE`,
        [event.paymentId],
      )
      const row = paymentResult.rows[0]
      if (!order || !row) {
        await this.rejectWebhook(
          client,
          webhookEventId,
          event.paymentId,
          'PAYMENT_NOT_FOUND',
        )
        return { kind: 'rejected', reason: 'PAYMENT_NOT_FOUND' }
      }
      const payment = toPayment(row)
      await client.query(
        'UPDATE payment_webhook_events SET payment_id=$2 WHERE id=$1',
        [webhookEventId, payment.id],
      )

      const orderAmount = Number(order.total_cents)
      if (
        event.orderId !== order.id ||
        payment.orderId !== order.id ||
        event.amountCents !== payment.amountCents ||
        event.amountCents !== orderAmount ||
        event.currency !== payment.currency
      ) {
        await this.rejectWebhook(
          client,
          webhookEventId,
          payment.id,
          'PAYLOAD_MISMATCH',
        )
        return { kind: 'rejected', payment, reason: 'PAYLOAD_MISMATCH' }
      }

      const nextStatus = statusForPaymentEvent(event.type)
      if (payment.status === nextStatus) {
        await this.completeWebhook(client, webhookEventId)
        return { kind: 'processed', payment }
      }
      if (
        isTerminalPaymentStatus(payment.status) &&
        nextStatus === 'PROCESSING'
      ) {
        await this.completeWebhook(client, webhookEventId)
        return { kind: 'stale', payment }
      }
      if (!canTransitionPayment(payment.status, nextStatus)) {
        await this.rejectWebhook(
          client,
          webhookEventId,
          payment.id,
          'INVALID_TRANSITION',
        )
        return { kind: 'rejected', payment, reason: 'INVALID_TRANSITION' }
      }

      if (nextStatus === 'APPROVED') {
        if (
          order.status !== 'PENDING_PAYMENT' ||
          order.payment_due_at.getTime() <= Date.now()
        ) {
          await this.rejectWebhook(
            client,
            webhookEventId,
            payment.id,
            'ORDER_EXPIRED',
          )
          return { kind: 'rejected', payment, reason: 'ORDER_EXPIRED' }
        }
        await this.confirmOrderPayment(client, order)
      }

      const updated = await client.query<PaymentRow>(
        `UPDATE payments
            SET status=$2::payment_status,updated_at=now(),
                paid_at=CASE WHEN $2::payment_status='APPROVED' THEN now() ELSE paid_at END
          WHERE id=$1
          RETURNING id,order_id,provider,provider_payment_id,method,
                    amount_cents::text,currency,status,idempotency_key,
                    created_at,updated_at,paid_at`,
        [payment.id, nextStatus],
      )
      const updatedPayment = toPayment(updated.rows[0]!)
      await this.completeWebhook(client, webhookEventId)
      await auditPayment(client, {
        actorId: null,
        action: 'PAYMENT_STATUS_CHANGED',
        resourceType: 'Payment',
        resourceId: payment.id,
        result: 'SUCCESS',
        source: 'payments.webhook',
      })
      return { kind: 'processed', payment: updatedPayment }
    })
  }

  private async confirmOrderPayment(
    client: PoolClient,
    order: {
      id: string
      customer_id: string
      status: string
      total_cents: string
      payment_due_at: Date
    },
  ) {
    const reservations = await client.query<{
      variant_id: string
      quantity: string
    }>(
      `SELECT variant_id,quantity::text
         FROM inventory_reservations
        WHERE order_id=$1 AND released_at IS NULL AND converted_at IS NULL
        ORDER BY variant_id
        FOR UPDATE`,
      [order.id],
    )
    if (!reservations.rowCount)
      throw new Error('Payment order has no active inventory reservations.')

    for (const reservation of reservations.rows) {
      const quantity = BigInt(reservation.quantity)
      const stock = await client.query(
        `UPDATE inventory_stocks
            SET quantity=quantity-$2::bigint,updated_at=now()
          WHERE variant_id=$1 AND quantity >= $2::bigint
          RETURNING variant_id`,
        [reservation.variant_id, quantity.toString()],
      )
      if (!stock.rowCount)
        throw new Error('Reserved inventory cannot be converted to stock exit.')

      const movementId = randomUUID()
      await client.query(
        `INSERT INTO inventory_movements
          (id,variant_id,actor_id,type,quantity,reason)
         VALUES ($1,$2,$3,'EXIT',$4,'PAYMENT_CONFIRMED')`,
        [
          movementId,
          reservation.variant_id,
          order.customer_id,
          (-quantity).toString(),
        ],
      )
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: order.customer_id,
          action: 'INVENTORY_EXIT_CREATED',
          resourceType: 'InventoryMovement',
          resourceId: movementId,
          result: 'SUCCESS',
          source: 'payments.inventory',
        }),
      )
    }

    const converted = await client.query(
      `UPDATE inventory_reservations
          SET converted_at=now()
        WHERE order_id=$1 AND released_at IS NULL AND converted_at IS NULL`,
      [order.id],
    )
    if (converted.rowCount !== reservations.rowCount)
      throw new Error('Inventory reservations changed during payment approval.')

    const orderUpdate = await client.query(
      `UPDATE orders
          SET status='PAYMENT_CONFIRMED',updated_at=now()
        WHERE id=$1 AND status='PENDING_PAYMENT' AND payment_due_at>now()`,
      [order.id],
    )
    if (!orderUpdate.rowCount)
      throw new PaymentError('Order payment deadline has expired.', 'EXPIRED')

    await auditPayment(client, {
      actorId: null,
      action: 'ORDER_PAYMENT_CONFIRMED',
      resourceType: 'Order',
      resourceId: order.id,
      result: 'SUCCESS',
      source: 'payments.webhook',
    })
  }

  private async completeWebhook(client: PoolClient, eventId: string) {
    await client.query(
      `UPDATE payment_webhook_events
          SET status='PROCESSED',processed_at=now()
        WHERE id=$1`,
      [eventId],
    )
  }

  private async rejectWebhook(
    client: PoolClient,
    eventId: string,
    paymentId: string | null,
    reason: string,
  ) {
    await client.query(
      `UPDATE payment_webhook_events
          SET payment_id=$2,status='REJECTED',rejection_reason=$3,processed_at=now()
        WHERE id=$1`,
      [eventId, paymentId, reason],
    )
    await insertAuditEvent(
      client,
      createAuditEvent({
        actorId: null,
        action: 'PAYMENT_WEBHOOK_REJECTED',
        resourceType: 'Payment',
        resourceId: paymentId,
        result: 'FAILURE',
        source: 'payments.webhook',
        metadata: { reasonCode: reason },
      }),
    )
  }
}
