import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Address, AddressInput } from '../domain/checkout'
import type { Pool } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'

type Row = {
  id: string
  customer_id: string
  recipient_name: string
  cpf: string
  phone: string
  postal_code: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  country: string
  complement: string | null
  reference: string | null
  created_at: Date
  updated_at: Date
}

const columns = `id, customer_id, recipient_name, cpf, phone, postal_code,
  street, number, neighborhood, city, state, country, complement, reference,
  created_at, updated_at`

function toAddress(row: Row): Address {
  return {
    id: row.id,
    customerId: row.customer_id,
    recipientName: row.recipient_name,
    cpf: row.cpf,
    phone: row.phone,
    postalCode: row.postal_code,
    street: row.street,
    number: row.number,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    ...(row.complement ? { complement: row.complement } : {}),
    ...(row.reference ? { reference: row.reference } : {}),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export class PostgresAddressRepository {
  private readonly pool: Pool

  constructor(pool: Pool = getDatabasePool()) {
    this.pool = pool
  }

  async create(customerId: string, input: AddressInput): Promise<Address> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query<Row>(
        `INSERT INTO customer_addresses
       (id, customer_id, recipient_name, cpf, phone, postal_code, street, number,
        neighborhood, city, state, country, complement, reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING ${columns}`,
        [
          randomUUID(),
          customerId,
          input.recipientName,
          input.cpf,
          input.phone,
          input.postalCode,
          input.street,
          input.number,
          input.neighborhood,
          input.city,
          input.state,
          input.country,
          input.complement ?? null,
          input.reference ?? null,
        ],
      )
      const address = toAddress(result.rows[0]!)
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: customerId,
          action: 'ADDRESS_CREATED',
          resourceType: 'Address',
          resourceId: address.id,
          result: 'SUCCESS',
          source: 'checkout.address',
        }),
      )
      await client.query('COMMIT')
      return address
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async list(customerId: string): Promise<Address[]> {
    const result = await this.pool.query<Row>(
      `SELECT ${columns} FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at, id`,
      [customerId],
    )
    return result.rows.map(toAddress)
  }

  async get(customerId: string, addressId: string): Promise<Address | null> {
    const result = await this.pool.query<Row>(
      `SELECT ${columns} FROM customer_addresses WHERE customer_id = $1 AND id = $2`,
      [customerId, addressId],
    )
    return result.rows[0] ? toAddress(result.rows[0]) : null
  }

  async update(
    customerId: string,
    addressId: string,
    input: AddressInput,
  ): Promise<Address | null> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query<Row>(
        `UPDATE customer_addresses SET recipient_name=$3, cpf=$4, phone=$5,
       postal_code=$6, street=$7, number=$8, neighborhood=$9, city=$10,
       state=$11, country=$12, complement=$13, reference=$14, updated_at=now()
       WHERE customer_id=$1 AND id=$2 RETURNING ${columns}`,
        [
          customerId,
          addressId,
          input.recipientName,
          input.cpf,
          input.phone,
          input.postalCode,
          input.street,
          input.number,
          input.neighborhood,
          input.city,
          input.state,
          input.country,
          input.complement ?? null,
          input.reference ?? null,
        ],
      )
      if (!result.rows[0]) {
        await client.query('COMMIT')
        return null
      }
      const address = toAddress(result.rows[0])
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId: customerId,
          action: 'ADDRESS_UPDATED',
          resourceType: 'Address',
          resourceId: address.id,
          result: 'SUCCESS',
          source: 'checkout.address',
        }),
      )
      await client.query('COMMIT')
      return address
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
