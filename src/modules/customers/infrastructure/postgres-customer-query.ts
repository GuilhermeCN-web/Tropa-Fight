import 'server-only'
import type { Pool } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import type { CustomerQueryRepository } from '../application/customer-query'
import {
  escapeLikePattern,
  isCustomerStatus,
  type CustomerDetail,
  type CustomerOrderSummary,
  type CustomerPageResult,
  type CustomerQuery,
  type CustomerStatus,
  type CustomerSummary,
} from '../domain/customer-query'

type CustomerRow = {
  id: string
  email: string
  status: string
  created_at: Date
  orders_count: string
}

type OrderRow = {
  id: string
  status: string
  total_cents: string
  created_at: Date
}

const orderStatuses = new Set([
  'PENDING_PAYMENT',
  'PAYMENT_CONFIRMED',
  'EXPIRED',
])

// Only non-sensitive columns are selected: no password hash, CPF, phone or address.
const customerFields = `u.id,u.email,u.status,u.created_at,
  (SELECT count(*)::text FROM orders o WHERE o.customer_id=u.id) AS orders_count`

function integer(value: string, name: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0)
    throw new Error(`Stored customer ${name} is outside the supported range.`)
  return parsed
}

function status(value: string): CustomerStatus {
  if (!isCustomerStatus(value))
    throw new Error('Stored customer status is outside the read contract.')
  return value
}

function mapCustomer(row: CustomerRow): CustomerSummary {
  return {
    id: row.id,
    email: row.email,
    status: status(row.status),
    createdAt: row.created_at.toISOString(),
    ordersCount: integer(row.orders_count, 'order count'),
  }
}

function mapOrder(row: OrderRow): CustomerOrderSummary {
  if (!orderStatuses.has(row.status))
    throw new Error('Stored order status is outside the read contract.')
  return {
    id: row.id,
    status: row.status as CustomerOrderSummary['status'],
    totalCents: integer(row.total_cents, 'order total'),
    createdAt: row.created_at.toISOString(),
  }
}

export class PostgresCustomerQueryRepository implements CustomerQueryRepository {
  private readonly configuredPool?: Pool

  constructor(configuredPool?: Pool) {
    this.configuredPool = configuredPool
  }

  private get pool(): Pool {
    return this.configuredPool ?? getDatabasePool()
  }

  async list(query: CustomerQuery): Promise<CustomerPageResult> {
    const conditions = ["u.account_type='CUSTOMER'"]
    const values: unknown[] = []
    if (query.filters.email) {
      values.push(`%${escapeLikePattern(query.filters.email)}%`)
      conditions.push(`lower(u.email) LIKE $${values.length} ESCAPE '\\'`)
    }
    if (query.filters.status) {
      values.push(query.filters.status)
      conditions.push(`u.status=$${values.length}`)
    }
    const where = `WHERE ${conditions.join(' AND ')}`
    const count = await this.pool.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM identity_users u ${where}`,
      values,
    )
    const offset = (query.page - 1) * query.pageSize
    const result = await this.pool.query<CustomerRow>(
      `SELECT ${customerFields} FROM identity_users u ${where}
       ORDER BY u.created_at DESC,u.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, query.pageSize, offset],
    )
    return {
      customers: result.rows.map(mapCustomer),
      page: query.page,
      pageSize: query.pageSize,
      total: integer(count.rows[0]?.total ?? '0', 'count'),
    }
  }

  async find(customerId: string): Promise<CustomerDetail | null> {
    const result = await this.pool.query<CustomerRow>(
      `SELECT ${customerFields} FROM identity_users u
        WHERE u.id=$1 AND u.account_type='CUSTOMER'`,
      [customerId],
    )
    const row = result.rows[0]
    if (!row) return null
    const orders = await this.pool.query<OrderRow>(
      `SELECT id,status,total_cents::text,created_at FROM orders
        WHERE customer_id=$1 ORDER BY created_at DESC,id DESC`,
      [customerId],
    )
    return { ...mapCustomer(row), orders: orders.rows.map(mapOrder) }
  }
}
