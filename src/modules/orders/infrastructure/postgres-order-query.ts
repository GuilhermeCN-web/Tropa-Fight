import 'server-only'
import type { Pool } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import type {
  AdminOrderFilters,
  OrderDetail,
  OrderItemView,
  OrderListItem,
  OrderPage,
  OrderPageResult,
  OrderShippingAddress,
  OrderStatus,
} from '../domain/order-query'
import { isOrderStatus } from '../domain/order-query'
import type { PaymentStatus } from '../../payments/domain/payment'
import type { OrderQueryRepository } from '../application/order-query'

type OrderRow = {
  id: string
  status: string
  created_at: Date
  updated_at?: Date
  payment_due_at?: Date
  coupon_code_snapshot?: string | null
  subtotal_cents: string
  discount_cents: string
  discount_label: string | null
  shipping_cents: string
  total_cents: string
  item_count: string
  payment_status: PaymentStatus | null
  payment_method: 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD' | null
  payment_amount_cents: string | null
  payment_currency: 'BRL' | null
  paid_at: Date | null
  shipment_status: 'NOT_SHIPPED' | null
  shipment_method: 'STANDARD' | null
  shipment_cents: string | null
  estimated_business_days: number | null
  estimated_delivery_date: string | Date | null
  address_snapshot?: unknown
}

type OrderItemRow = {
  id: string
  product_name_snapshot: string
  attributes_snapshot: unknown
  unit_price_cents: string
  quantity: string
  subtotal_cents: string
  discount_cents: string
}

const orderJoins = `
  FROM orders o
  LEFT JOIN payments p ON p.order_id=o.id
  LEFT JOIN shipments s ON s.order_id=o.id
`

function integer(value: string, name: string, allowZero = true): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < (allowZero ? 0 : 1))
    throw new Error(`Stored order ${name} is outside the supported range.`)
  return parsed
}

function status(value: string): OrderStatus {
  if (!isOrderStatus(value))
    throw new Error(
      'Stored order status is outside the approved read contract.',
    )
  return value
}

function iso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString()
}

function dateOnly(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value.slice(0, 10)
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Stored order address snapshot is invalid.')
  return value
}

function shippingAddress(value: unknown): OrderShippingAddress {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Stored order address snapshot is invalid.')
  const record = value as Record<string, unknown>
  const address: OrderShippingAddress = {
    recipientName: requiredString(record, 'recipientName'),
    postalCode: requiredString(record, 'postalCode'),
    street: requiredString(record, 'street'),
    number: requiredString(record, 'number'),
    neighborhood: requiredString(record, 'neighborhood'),
    city: requiredString(record, 'city'),
    state: requiredString(record, 'state'),
    country: requiredString(record, 'country'),
  }
  if (typeof record.complement === 'string' && record.complement)
    address.complement = record.complement
  if (typeof record.reference === 'string' && record.reference)
    address.reference = record.reference
  return address
}

function mapOrder(row: OrderRow): OrderListItem {
  const totalCents = integer(row.total_cents, 'total', false)
  const payment = row.payment_status
    ? {
        status: row.payment_status,
        method: row.payment_method!,
        amountCents: integer(
          row.payment_amount_cents!,
          'payment amount',
          false,
        ),
        currency: row.payment_currency!,
        paidAt: row.paid_at ? iso(row.paid_at) : null,
      }
    : null
  const shipment = row.shipment_status
    ? {
        status: row.shipment_status,
        method: row.shipment_method!,
        shippingCents: integer(row.shipment_cents!, 'shipment amount'),
        estimatedBusinessDays: row.estimated_business_days!,
        estimatedDeliveryDate: dateOnly(row.estimated_delivery_date!),
      }
    : null
  return {
    id: row.id,
    status: status(row.status),
    createdAt: iso(row.created_at),
    subtotalCents: integer(row.subtotal_cents, 'subtotal'),
    discountCents: integer(row.discount_cents, 'discount'),
    discountLabel: row.discount_label,
    shippingCents: integer(row.shipping_cents, 'shipping'),
    totalCents,
    currency: 'BRL',
    itemCount: integer(row.item_count, 'item count'),
    payment,
    shipment,
  }
}

const orderFields = `o.id,o.status,o.created_at,o.subtotal_cents::text,
  o.discount_cents::text,o.discount_label,o.coupon_code_snapshot,o.shipping_cents::text,
  o.total_cents::text,
  (SELECT count(*)::text FROM order_items oi WHERE oi.order_id=o.id) AS item_count,
  p.status AS payment_status,p.method AS payment_method,
  p.amount_cents::text AS payment_amount_cents,p.currency AS payment_currency,
  p.paid_at,s.status AS shipment_status,s.method AS shipment_method,
  s.shipping_cents::text AS shipment_cents,s.estimated_business_days,
  s.estimated_delivery_date`

export class PostgresOrderQueryRepository implements OrderQueryRepository {
  private readonly configuredPool?: Pool

  constructor(configuredPool?: Pool) {
    this.configuredPool = configuredPool
  }

  private get pool(): Pool {
    return this.configuredPool ?? getDatabasePool()
  }

  private async list(where: string, values: unknown[], page: OrderPage) {
    const count = await this.pool.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM orders o ${where}`,
      values,
    )
    const offset = (page.page - 1) * page.pageSize
    const result = await this.pool.query<OrderRow>(
      `SELECT ${orderFields} ${orderJoins} ${where}
       ORDER BY o.created_at DESC,o.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, page.pageSize, offset],
    )
    return {
      orders: result.rows.map(mapOrder),
      page: page.page,
      pageSize: page.pageSize,
      total: integer(count.rows[0]?.total ?? '0', 'order count'),
    }
  }

  listForCustomer(
    customerId: string,
    page: OrderPage,
  ): Promise<OrderPageResult> {
    return this.list('WHERE o.customer_id=$1', [customerId], page)
  }

  listForAdmin(
    page: OrderPage,
    filters: AdminOrderFilters,
  ): Promise<OrderPageResult> {
    const conditions: string[] = []
    const values: unknown[] = []
    if (filters.status) {
      values.push(filters.status)
      conditions.push(`o.status=$${values.length}`)
    }
    if (filters.from) {
      values.push(filters.from)
      conditions.push(`o.created_at>=$${values.length}`)
    }
    if (filters.to) {
      values.push(filters.to)
      conditions.push(`o.created_at<$${values.length}`)
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    return this.list(where, values, page)
  }

  findForCustomer(
    customerId: string,
    orderId: string,
  ): Promise<OrderDetail | null> {
    return this.find(orderId, 'WHERE o.id=$1 AND o.customer_id=$2', [
      orderId,
      customerId,
    ])
  }

  findForAdmin(orderId: string): Promise<OrderDetail | null> {
    return this.find(orderId, 'WHERE o.id=$1', [orderId])
  }

  private async find(
    orderId: string,
    where: string,
    values: unknown[],
  ): Promise<OrderDetail | null> {
    const result = await this.pool.query<OrderRow>(
      `SELECT ${orderFields},o.updated_at,o.payment_due_at,
              o.address_snapshot
         ${orderJoins} ${where}`,
      values,
    )
    const row = result.rows[0]
    if (!row) return null

    const itemsResult = await this.pool.query<OrderItemRow>(
      `SELECT id,product_name_snapshot,attributes_snapshot,
              unit_price_cents::text,quantity::text,subtotal_cents::text,
              discount_cents::text
         FROM order_items WHERE order_id=$1 ORDER BY id`,
      [orderId],
    )
    const items: OrderItemView[] = itemsResult.rows.map((item) => {
      if (
        !item.attributes_snapshot ||
        typeof item.attributes_snapshot !== 'object' ||
        Array.isArray(item.attributes_snapshot)
      )
        throw new Error('Stored order item snapshot is invalid.')
      return {
        id: item.id,
        productName: item.product_name_snapshot,
        attributes: item.attributes_snapshot as Record<string, unknown>,
        unitPriceCents: integer(item.unit_price_cents, 'item unit price'),
        quantity: integer(item.quantity, 'item quantity', false),
        subtotalCents: integer(item.subtotal_cents, 'item subtotal'),
        discountCents: integer(item.discount_cents, 'item discount'),
      }
    })
    return {
      ...mapOrder(row),
      updatedAt: iso(row.updated_at!),
      paymentDueAt: iso(row.payment_due_at!),
      couponCode: row.coupon_code_snapshot ?? null,
      address: shippingAddress(row.address_snapshot),
      items,
      tracking: null,
    }
  }
}
