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
  findPrincipalBySession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import { POST as registerApi } from '../../app/api/auth/register/route'
import { POST as loginApi } from '../../app/api/auth/login/route'
import { POST as logoutApi } from '../../app/api/auth/logout/route'
import { GET as sessionApi } from '../../app/api/auth/session/route'
import { GET as meApi } from '../../app/api/me/route'
import { GET as adminRolesApi } from '../../app/api/admin/identity/roles/route'

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
      expect(await registration.json()).toMatchObject({
        user: { email: apiEmail, status: 'ACTIVE' },
      })
      const apiLogin = await loginApi(
        jsonRequest('/api/auth/login', {
          email: apiEmail,
          password: 'ValidPass1!',
        }),
      )
      expect(apiLogin.status).toBe(200)
      const cookie = apiLogin.cookies.get('tropa_session')?.value
      expect(cookie).toBeTruthy()
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
      await pool.query('DELETE FROM identity_users WHERE email = $1', [
        apiEmail,
      ])

      let deliveredToken: string | undefined
      const delivery: RecoveryEmailPort = {
        async sendRecoveryLink(_address, token) {
          deliveredToken = token
        },
      }
      await requestPasswordRecovery(email, delivery)
      expect(deliveredToken).toBeTruthy()
      if (!deliveredToken) throw new Error('Recovery token was not delivered.')

      expect(await completePasswordRecovery(deliveredToken, 'NewValid1!')).toBe(
        true,
      )
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
