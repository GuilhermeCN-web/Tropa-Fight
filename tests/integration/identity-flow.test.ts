import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  authenticate,
  completePasswordRecovery,
  registerCustomer,
  requestPasswordRecovery,
} from '../../src/modules/identity/application/identity-service'
import type { RecoveryEmailPort } from '../../src/modules/identity/application/recovery-email-port'
import {
  createSession,
  findPrincipalBySession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { POST as registerApi } from '../../app/api/auth/register/route'
import { POST as loginApi } from '../../app/api/auth/login/route'
import { POST as logoutApi } from '../../app/api/auth/logout/route'
import { GET as sessionApi } from '../../app/api/auth/session/route'
import { GET as meApi } from '../../app/api/me/route'
import { GET as adminRolesApi } from '../../app/api/admin/identity/roles/route'
import { GET as auditLogsApi } from '../../app/api/admin/audit-logs/route'

function jsonRequest(
  path: string,
  body?: unknown,
  cookie?: string,
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

const databaseConfigured = Boolean(process.env.DATABASE_URL)

afterAll(async () => {
  if (databaseConfigured) await getDatabasePool().end()
})

describe.skipIf(!databaseConfigured)('identity PostgreSQL integration', () => {
  it('registers, authenticates, revokes sessions, and consumes recovery once', async () => {
    const email = `identity-${randomUUID()}@example.test`
    let sessionToken: string | undefined
    let replacementToken: string | undefined
    const pool = getDatabasePool()

    try {
      const userId = await registerCustomer(email, 'ValidPass1!')
      sessionToken = await authenticate(email, 'ValidPass1!')
      const principal = await findPrincipalBySession(sessionToken)

      expect(principal?.id).toBe(userId)
      expect(principal?.roles).toContain('CUSTOMER')
      expect(principal?.permissions).toContain('identity.profile.read:self')
      expect(principal?.permissions).not.toContain(
        'identity.profile.update:self',
      )
      await expect(authenticate(email, 'WrongPass1!')).rejects.toThrow()

      const apiEmail = `api-${randomUUID()}@example.test`
      const registration = await registerApi(
        jsonRequest('/api/auth/register', {
          email: apiEmail,
          password: 'ValidPass1!',
        }),
      )
      expect(registration.status).toBe(201)
      const registeredBody = await registration.json()
      expect(registeredBody).toMatchObject({
        user: { email: apiEmail, status: 'ACTIVE' },
      })
      const registrationAudit = await pool.query<{ id: string }>(
        `SELECT id FROM audit_logs
         WHERE action = 'USER_CREATED' AND resource_id = $1`,
        [registeredBody.user.id],
      )
      expect(registrationAudit.rowCount).toBe(1)

      const rejectedEmail = `audit-failure-${randomUUID()}@example.test`
      const failureId = randomUUID().replaceAll('-', '')
      const failureFunction = `reject_audit_test_${failureId}`
      const failureTrigger = `reject_audit_test_${failureId}`
      await pool.query(`
        CREATE FUNCTION ${failureFunction}() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.action = 'USER_CREATED' THEN
            RAISE EXCEPTION 'forced audit persistence failure';
          END IF;
          RETURN NEW;
        END;
        $$`)
      await pool.query(`
        CREATE TRIGGER ${failureTrigger}
        BEFORE INSERT ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION ${failureFunction}()`)
      try {
        await expect(
          registerCustomer(rejectedEmail, 'ValidPass1!'),
        ).rejects.toThrow('forced audit persistence failure')
        const rolledBackUser = await pool.query(
          'SELECT id FROM identity_users WHERE email = $1',
          [rejectedEmail],
        )
        expect(rolledBackUser.rowCount).toBe(0)
      } finally {
        await pool.query(
          `DROP TRIGGER IF EXISTS ${failureTrigger} ON audit_logs`,
        )
        await pool.query(`DROP FUNCTION IF EXISTS ${failureFunction}()`)
      }

      const apiLogin = await loginApi(
        jsonRequest('/api/auth/login', {
          email: apiEmail,
          password: 'ValidPass1!',
        }),
      )
      expect(apiLogin.status).toBe(200)
      const cookie = apiLogin.cookies.get('tropa_session')?.value
      expect(cookie).toBeTruthy()
      const loginAudit = await pool.query<{ id: string }>(
        `SELECT id FROM audit_logs
         WHERE action = 'AUTH_LOGIN' AND actor_id = $1`,
        [registeredBody.user.id],
      )
      expect(loginAudit.rowCount).toBe(1)
      const cookieHeader = `tropa_session=${cookie}`
      expect(
        (
          await sessionApi(
            jsonRequest('/api/auth/session', undefined, cookieHeader),
          )
        ).status,
      ).toBe(200)
      expect(
        (await meApi(jsonRequest('/api/me', undefined, cookieHeader))).status,
      ).toBe(200)
      expect(
        (
          await adminRolesApi(
            jsonRequest('/api/admin/identity/roles', undefined, cookieHeader),
          )
        ).status,
      ).toBe(403)
      expect(
        (await adminRolesApi(jsonRequest('/api/admin/identity/roles'))).status,
      ).toBe(401)
      expect(
        (await auditLogsApi(jsonRequest('/api/admin/audit-logs'))).status,
      ).toBe(401)
      expect(
        (
          await auditLogsApi(
            jsonRequest('/api/admin/audit-logs', undefined, cookieHeader),
          )
        ).status,
      ).toBe(403)
      const failedLogin = await loginApi(
        jsonRequest('/api/auth/login', {
          email: apiEmail,
          password: 'WrongPass1!',
        }),
      )
      expect(failedLogin.status).toBe(401)
      const failedLoginAudit = await pool.query<{ id: string }>(
        "SELECT id FROM audit_logs WHERE action = 'AUTH_LOGIN_FAILED' AND result = 'FAILURE'",
      )
      expect(Number(failedLoginAudit.rowCount)).toBeGreaterThan(0)
      expect(
        (await logoutApi(jsonRequest('/api/auth/logout', {}, cookieHeader)))
          .status,
      ).toBe(200)
      expect(
        (
          await sessionApi(
            jsonRequest('/api/auth/session', undefined, cookieHeader),
          )
        ).status,
      ).toBe(401)
      const logoutAudit = await pool.query<{ id: string }>(
        `SELECT id FROM audit_logs
         WHERE action = 'AUTH_LOGOUT' AND actor_id = $1`,
        [registeredBody.user.id],
      )
      expect(logoutAudit.rowCount).toBe(1)

      const adminId = randomUUID()
      const adminEmail = `audit-admin-${randomUUID()}@example.test`
      let adminSession: string | undefined
      try {
        await pool.query(
          `INSERT INTO identity_users (id, email, password_hash, account_type, status)
           VALUES ($1, $2, 'test-hash', 'ADMIN', 'ACTIVE')`,
          [adminId, adminEmail],
        )
        await pool.query(
          "INSERT INTO identity_user_roles (user_id, role_code) VALUES ($1, 'GENERAL_ADMIN')",
          [adminId],
        )
        adminSession = await createSession(adminId)
        const authorizedAudit = await auditLogsApi(
          jsonRequest(
            '/api/admin/audit-logs?page=1&pageSize=2',
            undefined,
            `tropa_session=${adminSession}`,
          ),
        )
        expect(authorizedAudit.status).toBe(200)
        const auditResponseBody = await authorizedAudit.json()
        expect(auditResponseBody).toMatchObject({
          page: 1,
          pageSize: 2,
        })
        const auditJson = JSON.stringify(auditResponseBody)
        expect(auditJson).not.toMatch(/"(?:password|token|secret|email)"\s*:/i)
        expect(auditJson).not.toContain('@')
        const filteredAudit = await auditLogsApi(
          jsonRequest(
            `/api/admin/audit-logs?actorId=${adminId}&action=AUTH_LOGIN&resourceType=Session&result=SUCCESS&from=2020-01-01T00%3A00%3A00.000Z&to=2099-01-01T00%3A00%3A00.000Z`,
            undefined,
            `tropa_session=${adminSession}`,
          ),
        )
        expect(filteredAudit.status).toBe(200)
        const filteredBody = await filteredAudit.json()
        expect(filteredBody.entries.length).toBeGreaterThan(0)
        expect(
          filteredBody.entries.every(
            (entry: { actorId: string; action: string }) =>
              entry.actorId === adminId && entry.action === 'AUTH_LOGIN',
          ),
        ).toBe(true)
        const invalidAuditQuery = await auditLogsApi(
          jsonRequest(
            '/api/admin/audit-logs?pageSize=1000',
            undefined,
            `tropa_session=${adminSession}`,
          ),
        )
        expect(invalidAuditQuery.status).toBe(400)
        const immutableId = await pool.query<{ id: string }>(
          "SELECT id FROM audit_logs WHERE actor_id = $1 AND action = 'AUTH_LOGIN' ORDER BY created_at DESC LIMIT 1",
          [adminId],
        )
        await expect(
          pool.query(
            "UPDATE audit_logs SET source = 'tampered' WHERE id = $1",
            [immutableId.rows[0]?.id],
          ),
        ).rejects.toThrow('Audit logs are immutable.')
        await expect(pool.query('TRUNCATE audit_logs')).rejects.toThrow(
          'Audit logs are immutable.',
        )
      } finally {
        if (adminSession) await revokeSession(adminSession)
        await pool.query('DELETE FROM identity_users WHERE id = $1', [adminId])
      }
      await pool.query('DELETE FROM identity_users WHERE email = $1', [
        apiEmail,
      ])

      let deliveredToken: string | undefined
      const delivery: RecoveryEmailPort = {
        async sendRecoveryLink(_address, token) {
          deliveredToken = token
        },
      }
      const recoveryRequestCount = await pool.query<{ total: string }>(
        "SELECT count(*)::text AS total FROM audit_logs WHERE action = 'AUTH_PASSWORD_RESET_REQUESTED'",
      )
      await requestPasswordRecovery(email, delivery)
      expect(deliveredToken).toBeTruthy()
      const recoveryRequestedAudit = await pool.query<{ id: string }>(
        "SELECT id FROM audit_logs WHERE action = 'AUTH_PASSWORD_RESET_REQUESTED' AND result = 'SUCCESS'",
      )
      expect(Number(recoveryRequestedAudit.rowCount)).toBe(
        Number(recoveryRequestCount.rows[0]?.total) + 1,
      )
      if (!deliveredToken) throw new Error('Recovery token was not delivered.')

      expect(await completePasswordRecovery(deliveredToken, 'NewValid1!')).toBe(
        true,
      )
      const recoveryCompletedAudit = await pool.query<{ id: string }>(
        "SELECT id FROM audit_logs WHERE action = 'AUTH_PASSWORD_RESET' AND resource_id = $1",
        [userId],
      )
      expect(recoveryCompletedAudit.rowCount).toBe(1)
      expect(await completePasswordRecovery(deliveredToken, 'NewValid1!')).toBe(
        false,
      )
      expect(await findPrincipalBySession(sessionToken)).toBeNull()
      await expect(authenticate(email, 'ValidPass1!')).rejects.toThrow()
      replacementToken = await authenticate(email, 'NewValid1!')
      expect(replacementToken).toBeTruthy()
    } finally {
      if (sessionToken) await revokeSession(sessionToken)
      if (replacementToken) await revokeSession(replacementToken)
      await pool.query('DELETE FROM identity_users WHERE email = $1', [email])
    }
  })
})
