import 'server-only'
import type { Pool } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import type { OrderRecipientResolver } from '../application/order-notifications'

export class PostgresOrderRecipientResolver implements OrderRecipientResolver {
  private readonly configuredPool?: Pool

  constructor(configuredPool?: Pool) {
    this.configuredPool = configuredPool
  }

  async customerIdForOrder(orderId: string): Promise<string | null> {
    const pool = this.configuredPool ?? getDatabasePool()
    const result = await pool.query<{ customer_id: string }>(
      'SELECT customer_id FROM orders WHERE id=$1',
      [orderId],
    )
    return result.rows[0]?.customer_id ?? null
  }
}
