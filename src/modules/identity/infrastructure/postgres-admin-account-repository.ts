import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '../../../infrastructure/database/pool'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { insertAuditEvent } from '../../audit/infrastructure/audit-repository'
import type { AdminAccountRepository } from '../application/admin-account-service'
import {
  AdminAccountError,
  assertKeepsAGeneralAdmin,
  isAdminRole,
  type AdminAccount,
  type AdminAccountChange,
  type AdminRole,
} from '../domain/admin-account'

type AccountRow = {
  id: string
  email: string
  status: AdminAccount['status']
  role: string
}

// Serializes administrative account mutations so the RN-022 check
// ("at least one active GENERAL_ADMIN") cannot race between transactions.
const adminAccountLockKey = 'identity.admin-accounts'

function mapAccount(row: AccountRow): AdminAccount {
  if (!isAdminRole(row.role))
    throw new Error('Stored administrative role is outside the contract.')
  return { id: row.id, email: row.email, status: row.status, role: row.role }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

async function findForUpdate(client: PoolClient, userId: string) {
  const result = await client.query<AccountRow>(
    `SELECT u.id,u.email,u.status,ur.role_code AS role
       FROM identity_users u
       JOIN identity_user_roles ur ON ur.user_id=u.id
      WHERE u.id=$1 AND u.account_type='ADMIN'
      FOR UPDATE OF u`,
    [userId],
  )
  return result.rows[0] ? mapAccount(result.rows[0]) : null
}

export class PostgresAdminAccountRepository implements AdminAccountRepository {
  private readonly configuredPool?: Pool

  constructor(configuredPool?: Pool) {
    this.configuredPool = configuredPool
  }

  private get pool(): Pool {
    return this.configuredPool ?? getDatabasePool()
  }

  async list(): Promise<AdminAccount[]> {
    const result = await this.pool.query<AccountRow>(
      `SELECT u.id,u.email,u.status,ur.role_code AS role
         FROM identity_users u
         JOIN identity_user_roles ur ON ur.user_id=u.id
        WHERE u.account_type='ADMIN'
        ORDER BY lower(u.email),u.id`,
    )
    return result.rows.map(mapAccount)
  }

  async create(
    actorId: string,
    account: { email: string; passwordHash: string; role: AdminRole },
  ): Promise<AdminAccount> {
    const userId = randomUUID()
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO identity_users (id,email,password_hash,account_type,status)
         VALUES ($1,$2,$3,'ADMIN','ACTIVE')`,
        [userId, account.email, account.passwordHash],
      )
      await client.query(
        'INSERT INTO identity_user_roles (user_id,role_code) VALUES ($1,$2)',
        [userId, account.role],
      )
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId,
          action: 'USER_CREATED',
          resourceType: 'IdentityUser',
          resourceId: userId,
          result: 'SUCCESS',
          source: 'identity.admin-users',
          metadata: { reasonCode: account.role },
        }),
      )
      await client.query('COMMIT')
      return {
        id: userId,
        email: account.email,
        status: 'ACTIVE',
        role: account.role,
      }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined)
      if (isUniqueViolation(error))
        throw new AdminAccountError(
          'An account with this email already exists.',
          'CONFLICT',
        )
      throw error
    } finally {
      client.release()
    }
  }

  async update(
    actorId: string,
    userId: string,
    change: AdminAccountChange,
  ): Promise<AdminAccount | null> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        adminAccountLockKey,
      ])
      const current = await findForUpdate(client, userId)
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }
      const others = await client.query<{ total: string }>(
        `SELECT count(*)::text AS total
           FROM identity_users u
           JOIN identity_user_roles ur ON ur.user_id=u.id
          WHERE u.id<>$1 AND u.account_type='ADMIN' AND u.status='ACTIVE'
            AND ur.role_code='GENERAL_ADMIN'`,
        [userId],
      )
      try {
        assertKeepsAGeneralAdmin(
          current,
          change,
          Number(others.rows[0]?.total ?? '0'),
        )
      } catch (error) {
        await client.query('ROLLBACK')
        await this.auditRejected(actorId, userId, change)
        throw error
      }

      const next: AdminAccount = { ...current }
      if (change.status !== undefined && change.status !== current.status) {
        await client.query(
          'UPDATE identity_users SET status=$2,updated_at=now() WHERE id=$1',
          [userId, change.status],
        )
        if (change.status === 'INACTIVE')
          await client.query(
            `UPDATE identity_sessions SET revoked_at=now()
              WHERE user_id=$1 AND revoked_at IS NULL`,
            [userId],
          )
        await insertAuditEvent(
          client,
          createAuditEvent({
            actorId,
            action: 'USER_UPDATED',
            resourceType: 'IdentityUser',
            resourceId: userId,
            result: 'SUCCESS',
            source: 'identity.admin-users',
            metadata: { reasonCode: `STATUS_${change.status}` },
          }),
        )
        next.status = change.status
      }
      if (change.role !== undefined && change.role !== current.role) {
        await client.query(
          'UPDATE identity_user_roles SET role_code=$2,assigned_at=now() WHERE user_id=$1',
          [userId, change.role],
        )
        await client.query(
          'UPDATE identity_users SET updated_at=now() WHERE id=$1',
          [userId],
        )
        await insertAuditEvent(
          client,
          createAuditEvent({
            actorId,
            action: 'USER_ROLE_CHANGED',
            resourceType: 'IdentityUser',
            resourceId: userId,
            result: 'SUCCESS',
            source: 'identity.admin-users',
            metadata: { reasonCode: change.role },
          }),
        )
        next.role = change.role
      }
      await client.query('COMMIT')
      return next
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined)
      throw error
    } finally {
      client.release()
    }
  }

  private async auditRejected(
    actorId: string,
    userId: string,
    change: AdminAccountChange,
  ) {
    const client = await this.pool.connect()
    try {
      await insertAuditEvent(
        client,
        createAuditEvent({
          actorId,
          action:
            change.role !== undefined ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
          resourceType: 'IdentityUser',
          resourceId: userId,
          result: 'FAILURE',
          source: 'identity.admin-users',
          metadata: { reasonCode: 'LAST_GENERAL_ADMIN' },
        }),
      )
    } finally {
      client.release()
    }
  }
}
