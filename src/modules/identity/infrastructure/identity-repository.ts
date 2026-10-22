import 'server-only'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import type { IdentityPrincipal } from '../domain/identity-user'
import { getDatabasePool } from '../../../infrastructure/database/pool'

const sessionLifetimeMilliseconds = 12 * 60 * 60 * 1000
const recoveryLifetimeMilliseconds = 30 * 60 * 1000

function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

async function loadPrincipal(
  client: PoolClient,
  userId: string,
): Promise<IdentityPrincipal | null> {
  const result = await client.query<{
    id: string
    email: string
    account_type: IdentityPrincipal['accountType']
    status: IdentityPrincipal['status']
    created_at: Date
    roles: string[] | null
    permissions: string[] | null
  }>(
    `SELECT u.id, u.email, u.account_type, u.status, u.created_at,
            array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL) AS roles,
            array_agg(DISTINCT rp.permission_code)
              FILTER (WHERE rp.permission_code IS NOT NULL) AS permissions
     FROM identity_users u
     LEFT JOIN identity_user_roles ur ON ur.user_id = u.id
     LEFT JOIN identity_roles r ON r.code = ur.role_code
     LEFT JOIN identity_role_permissions rp ON rp.role_code = r.code
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId],
  )
  const row = result.rows[0]
  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    accountType: row.account_type,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    roles: row.roles ?? [],
    permissions: row.permissions ?? [],
  }
}

export async function createCustomer(
  email: string,
  passwordHash: string,
): Promise<string> {
  const client = await getDatabasePool().connect()
  const userId = randomUUID()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO identity_users (id, email, password_hash, account_type, status)
       VALUES ($1, $2, $3, 'CUSTOMER', 'ACTIVE')`,
      [userId, email, passwordHash],
    )
    await client.query(
      "INSERT INTO identity_user_roles (user_id, role_code) VALUES ($1, 'CUSTOMER')",
      [userId],
    )
    await client.query('COMMIT')
    return userId
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findCredentialByEmail(email: string): Promise<{
  id: string
  passwordHash: string
  status: IdentityPrincipal['status']
} | null> {
  const result = await getDatabasePool().query<{
    id: string
    password_hash: string
    status: IdentityPrincipal['status']
  }>(
    'SELECT id, password_hash, status FROM identity_users WHERE lower(email) = $1',
    [email],
  )
  const row = result.rows[0]
  return row
    ? { id: row.id, passwordHash: row.password_hash, status: row.status }
    : null
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await getDatabasePool().query(
    `INSERT INTO identity_sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ($4 * interval '1 millisecond'))`,
    [randomUUID(), userId, hashOpaqueToken(token), sessionLifetimeMilliseconds],
  )
  return token
}

export async function findPrincipalBySession(
  token: string,
): Promise<IdentityPrincipal | null> {
  const client = await getDatabasePool().connect()
  try {
    const result = await client.query<{ user_id: string }>(
      `SELECT s.user_id
       FROM identity_sessions s
       JOIN identity_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL
         AND s.expires_at > now() AND u.status = 'ACTIVE'`,
      [hashOpaqueToken(token)],
    )
    const userId = result.rows[0]?.user_id
    return userId ? loadPrincipal(client, userId) : null
  } finally {
    client.release()
  }
}

export async function revokeSession(token: string): Promise<void> {
  await getDatabasePool().query(
    `UPDATE identity_sessions SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashOpaqueToken(token)],
  )
}

export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await getDatabasePool().query(
    `INSERT INTO identity_password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ($4 * interval '1 millisecond'))`,
    [
      randomUUID(),
      userId,
      hashOpaqueToken(token),
      recoveryLifetimeMilliseconds,
    ],
  )
  return token
}

export async function resetPassword(
  token: string,
  passwordHash: string,
): Promise<boolean> {
  const client = await getDatabasePool().connect()
  try {
    await client.query('BEGIN')
    const reset = await client.query<{ user_id: string }>(
      `UPDATE identity_password_reset_tokens
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [hashOpaqueToken(token)],
    )
    const userId = reset.rows[0]?.user_id
    if (!userId) {
      await client.query('ROLLBACK')
      return false
    }

    await client.query(
      'UPDATE identity_users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [passwordHash, userId],
    )
    await client.query(
      'UPDATE identity_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    )
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findPrincipalById(
  userId: string,
): Promise<IdentityPrincipal | null> {
  const client = await getDatabasePool().connect()
  try {
    return loadPrincipal(client, userId)
  } finally {
    client.release()
  }
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const result = await getDatabasePool().query<{ id: string }>(
    "SELECT id FROM identity_users WHERE lower(email) = $1 AND status = 'ACTIVE'",
    [email],
  )
  return result.rows[0]?.id ?? null
}

export async function listRoles(): Promise<
  Array<{ code: string; name: string }>
> {
  const result = await getDatabasePool().query<{
    code: string
    display_name: string
  }>('SELECT code, display_name FROM identity_roles ORDER BY code')
  return result.rows.map(({ code, display_name }) => ({
    code,
    name: display_name,
  }))
}
