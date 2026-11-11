import { randomUUID } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '../../src/infrastructure/database/pool'
import {
  createSession,
  revokeSession,
} from '../../src/modules/identity/infrastructure/identity-repository'
import {
  principalFromCookie,
  sessionCookieName,
} from '../../src/modules/auth/application/session-service'
import { authenticate } from '../../src/modules/identity/application/identity-service'
import { GET as listModeration } from '../../app/api/admin/reviews/route'
import { PATCH as moderate } from '../../app/api/admin/reviews/[reviewId]/route'
import { GET as listPublicReviews } from '../../app/api/products/[id]/reviews/route'
import {
  GET as listUsers,
  POST as createUser,
} from '../../app/api/admin/users/route'
import { PATCH as updateUser } from '../../app/api/admin/users/[userId]/route'
import { PostgresAdminAccountRepository } from '../../src/modules/identity/infrastructure/postgres-admin-account-repository'

// TASK-019: RF-037, RF-038; RN-015, RN-019, RN-022, RN-023; UC-018–UC-020.
// Runs in an isolated schema so RN-022 ("last active GENERAL_ADMIN") can be
// exercised without interference from other suites' administrator fixtures.
const configured = Boolean(process.env.DATABASE_URL)
const basePool = configured ? getDatabasePool() : undefined
const schema = `task019_test_${randomUUID().replaceAll('-', '')}`
let testPool: Pool | undefined

const ids = {
  generalAdmin: randomUUID(),
  catalogManager: randomUUID(),
  customer: randomUUID(),
  secondCustomer: randomUUID(),
  brand: randomUUID(),
  category: randomUUID(),
  product: randomUUID(),
  publishReview: randomUUID(),
  rejectReview: randomUUID(),
}
const tokens: Record<'general' | 'catalog' | 'customer', string | undefined> = {
  general: undefined,
  catalog: undefined,
  customer: undefined,
}
const strongPassword = 'Tropa#2026x'

function request(path: string, method = 'GET', token?: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(token ? { cookie: `${sessionCookieName}=${token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

const reviewContext = (reviewId: string) => ({
  params: Promise.resolve({ reviewId }),
})
const userContext = (userId: string) => ({
  params: Promise.resolve({ userId }),
})

async function auditRows(resourceId: string) {
  const result = await testPool!.query<{
    action: string
    actor_id: string | null
    result: string
    metadata: Record<string, string>
  }>(
    `SELECT action,actor_id,result,metadata FROM audit_logs
      WHERE resource_id=$1 ORDER BY created_at,id`,
    [resourceId],
  )
  return result.rows
}

async function createAdmin(email: string, role: string) {
  const response = await createUser(
    request('/api/admin/users', 'POST', tokens.general, {
      email,
      password: strongPassword,
      role,
    }),
  )
  expect(response!.status).toBe(201)
  return (await response!.json()).user as {
    id: string
    email: string
    status: string
    role: string
  }
}

describe.skipIf(!configured)(
  'review moderation and administrative accounts (TASK-019)',
  () => {
    beforeAll(async () => {
      await basePool!.query(`CREATE SCHEMA ${schema}`)
      testPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        options: `-c search_path=${schema},public`,
        application_name: 'tropa-fight-task019-tests',
      })
      globalThis.identityPool = testPool
      const migrationsPath = join(process.cwd(), 'db', 'migrations')
      const migrations = (await readdir(migrationsPath))
        .filter((file) => /^\d+.*\.sql$/.test(file))
        .sort((left, right) =>
          left.localeCompare(right, undefined, { numeric: true }),
        )
      const client = await testPool.connect()
      try {
        await client.query('BEGIN')
        for (const file of migrations)
          await client.query(await readFile(join(migrationsPath, file), 'utf8'))
        await client.query(
          `INSERT INTO identity_users (id,email,password_hash,account_type)
           VALUES ($1,'general@task019.test','test-hash','ADMIN'),
                  ($2,'catalog@task019.test','test-hash','ADMIN'),
                  ($3,'customer@task019.test','test-hash','CUSTOMER'),
                  ($4,'customer2@task019.test','test-hash','CUSTOMER')`,
          [
            ids.generalAdmin,
            ids.catalogManager,
            ids.customer,
            ids.secondCustomer,
          ],
        )
        await client.query(
          `INSERT INTO identity_user_roles (user_id,role_code)
           VALUES ($1,'GENERAL_ADMIN'),($2,'CATALOG_MANAGER'),($3,'CUSTOMER'),($4,'CUSTOMER')`,
          [
            ids.generalAdmin,
            ids.catalogManager,
            ids.customer,
            ids.secondCustomer,
          ],
        )
        await client.query(
          'INSERT INTO catalog_brands (id,name) VALUES ($1,$2)',
          [ids.brand, 'Task019 brand'],
        )
        await client.query(
          'INSERT INTO catalog_categories (id,name) VALUES ($1,$2)',
          [ids.category, 'Task019 category'],
        )
        await client.query(
          `INSERT INTO catalog_products (id,name,brand_id,publication_state)
           VALUES ($1,'Moderated glove',$2,'PUBLISHED')`,
          [ids.product, ids.brand],
        )
        await client.query(
          'INSERT INTO catalog_product_categories (product_id,category_id) VALUES ($1,$2)',
          [ids.product, ids.category],
        )
        await client.query(
          `INSERT INTO product_reviews (id,product_id,customer_id,rating,comment,status,created_at)
           VALUES ($1,$3,$4,5,'Excelente','PENDING','2026-11-01T10:00:00Z'),
                  ($2,$3,$5,1,'Ruim','PENDING','2026-11-02T10:00:00Z')`,
          [
            ids.publishReview,
            ids.rejectReview,
            ids.product,
            ids.customer,
            ids.secondCustomer,
          ],
        )
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
      tokens.general = await createSession(ids.generalAdmin)
      tokens.catalog = await createSession(ids.catalogManager)
      tokens.customer = await createSession(ids.customer)
    })

    afterAll(async () => {
      for (const token of Object.values(tokens))
        if (token) await revokeSession(token).catch(() => undefined)
      await testPool?.end()
      if (configured) {
        globalThis.identityPool = basePool
        await basePool!.query(`DROP SCHEMA ${schema} CASCADE`)
      }
    })

    describe('review moderation (RF-037, RN-015)', () => {
      it('lists pending reviews by default with product name, oldest first', async () => {
        const response = await listModeration(
          request('/api/admin/reviews', 'GET', tokens.general),
        )
        expect(response!.status).toBe(200)
        const body = await response!.json()
        expect(body).toMatchObject({ page: 1, pageSize: 20, total: 2 })
        expect(body.reviews.map((review: { id: string }) => review.id)).toEqual(
          [ids.publishReview, ids.rejectReview],
        )
        expect(body.reviews[0]).toMatchObject({
          status: 'PENDING',
          rating: 5,
          productName: 'Moderated glove',
        })

        for (const query of ['status=ARCHIVED', 'sort=rating', 'page=0'])
          expect(
            (
              await listModeration(
                request(`/api/admin/reviews?${query}`, 'GET', tokens.general),
              )
            )?.status,
          ).toBe(400)
      })

      it('publishes a pending review, exposes it publicly and audits the actor', async () => {
        const response = await moderate(
          request(
            `/api/admin/reviews/${ids.publishReview}`,
            'PATCH',
            tokens.general,
            { status: 'PUBLISHED' },
          ),
          reviewContext(ids.publishReview),
        )
        expect(response!.status).toBe(200)
        const { review } = await response!.json()
        expect(review).toMatchObject({
          status: 'PUBLISHED',
          comment: 'Excelente',
        })
        expect(review.publishedAt).not.toBeNull()

        const publicReviews = await listPublicReviews(
          request(`/api/products/${ids.product}/reviews`),
          { params: Promise.resolve({ id: ids.product }) },
        )
        const publicBody = await publicReviews!.json()
        expect(publicBody.total).toBe(1)
        expect(publicBody.reviews[0]).toMatchObject({
          rating: 5,
          comment: 'Excelente',
        })

        expect(await auditRows(ids.publishReview)).toEqual([
          {
            action: 'REVIEW_PUBLISHED',
            actor_id: ids.generalAdmin,
            result: 'SUCCESS',
            metadata: {},
          },
        ])
      })

      it('rejects a pending review, keeping it out of the public listing', async () => {
        const response = await moderate(
          request(
            `/api/admin/reviews/${ids.rejectReview}`,
            'PATCH',
            tokens.general,
            { status: 'REJECTED' },
          ),
          reviewContext(ids.rejectReview),
        )
        expect(response!.status).toBe(200)
        expect((await response!.json()).review).toMatchObject({
          status: 'REJECTED',
          publishedAt: null,
        })
        const publicReviews = await listPublicReviews(
          request(`/api/products/${ids.product}/reviews`),
          { params: Promise.resolve({ id: ids.product }) },
        )
        expect((await publicReviews!.json()).total).toBe(1)
        expect((await auditRows(ids.rejectReview))[0]).toMatchObject({
          action: 'REVIEW_REJECTED',
          actor_id: ids.generalAdmin,
          result: 'SUCCESS',
        })

        const rejected = await listModeration(
          request('/api/admin/reviews?status=REJECTED', 'GET', tokens.general),
        )
        expect(
          (await rejected!.json()).reviews.map((r: { id: string }) => r.id),
        ).toEqual([ids.rejectReview])
      })

      it('returns 409 for transitions that do not start at PENDING', async () => {
        for (const [reviewId, status] of [
          [ids.publishReview, 'REJECTED'],
          [ids.publishReview, 'PUBLISHED'],
          [ids.rejectReview, 'PUBLISHED'],
        ] as const) {
          const response = await moderate(
            request(`/api/admin/reviews/${reviewId}`, 'PATCH', tokens.general, {
              status,
            }),
            reviewContext(reviewId),
          )
          expect(response!.status).toBe(409)
        }
        expect(await auditRows(ids.publishReview)).toHaveLength(1)
      })

      it('validates the body, refuses content edits and returns 404 for unknown ids', async () => {
        for (const body of [
          { status: 'PENDING' },
          { status: 'PUBLISHED', comment: 'editado' },
          { status: 'REJECTED', reason: 'spam' },
          { comment: 'editado' },
          {},
        ]) {
          const response = await moderate(
            request(
              `/api/admin/reviews/${ids.publishReview}`,
              'PATCH',
              tokens.general,
              body,
            ),
            reviewContext(ids.publishReview),
          )
          expect(response!.status).toBe(400)
        }
        for (const reviewId of [randomUUID(), 'not-a-uuid'])
          expect(
            (
              await moderate(
                request(
                  `/api/admin/reviews/${reviewId}`,
                  'PATCH',
                  tokens.general,
                  { status: 'PUBLISHED' },
                ),
                reviewContext(reviewId),
              )
            )?.status,
          ).toBe(404)
      })

      it('denies CATALOG_MANAGER and CUSTOMER (403) and anonymous users (401)', async () => {
        for (const [token, status] of [
          [tokens.catalog, 403],
          [tokens.customer, 403],
          [undefined, 401],
        ] as const) {
          expect(
            (await listModeration(request('/api/admin/reviews', 'GET', token)))
              ?.status,
          ).toBe(status)
          expect(
            (
              await moderate(
                request(
                  `/api/admin/reviews/${ids.publishReview}`,
                  'PATCH',
                  token,
                  { status: 'REJECTED' },
                ),
                reviewContext(ids.publishReview),
              )
            )?.status,
          ).toBe(status)
        }
      })
    })

    describe('administrative accounts (RF-038, RN-022, RN-023)', () => {
      it('lists only administrative accounts with id, email, status and role', async () => {
        const response = await listUsers(
          request('/api/admin/users', 'GET', tokens.general),
        )
        expect(response!.status).toBe(200)
        const body = await response!.json()
        expect(body.users).toEqual([
          {
            id: ids.catalogManager,
            email: 'catalog@task019.test',
            status: 'ACTIVE',
            role: 'CATALOG_MANAGER',
          },
          {
            id: ids.generalAdmin,
            email: 'general@task019.test',
            status: 'ACTIVE',
            role: 'GENERAL_ADMIN',
          },
        ])
        expect(JSON.stringify(body)).not.toContain('hash')
        expect(
          (
            await listUsers(
              request('/api/admin/users?role=CUSTOMER', 'GET', tokens.general),
            )
          )?.status,
        ).toBe(400)
      })

      it('creates an administrative account that can sign in, and audits it', async () => {
        const user = await createAdmin(
          ' New.Manager@Task019.test ',
          'CATALOG_MANAGER',
        )
        expect(user).toMatchObject({
          email: 'new.manager@task019.test',
          status: 'ACTIVE',
          role: 'CATALOG_MANAGER',
        })
        const stored = await testPool!.query<{
          account_type: string
          password_hash: string
        }>(
          'SELECT account_type,password_hash FROM identity_users WHERE id=$1',
          [user.id],
        )
        expect(stored.rows[0]?.account_type).toBe('ADMIN')
        expect(stored.rows[0]?.password_hash).not.toContain(strongPassword)
        const token = await authenticate(
          'new.manager@task019.test',
          strongPassword,
        )
        const principal = await principalFromCookie(token)
        expect(principal?.roles).toEqual(['CATALOG_MANAGER'])
        await revokeSession(token)
        expect((await auditRows(user.id)).at(-1)).toMatchObject({
          action: 'USER_CREATED',
          actor_id: ids.generalAdmin,
          result: 'SUCCESS',
          metadata: { reasonCode: 'CATALOG_MANAGER' },
        })
      })

      it('rejects duplicate e-mails, weak passwords, other roles and extra fields', async () => {
        const cases: Array<[unknown, number]> = [
          [
            {
              email: 'GENERAL@task019.test',
              password: strongPassword,
              role: 'CATALOG_MANAGER',
            },
            409,
          ],
          [
            {
              email: 'weak@task019.test',
              password: 'weakpass',
              role: 'CATALOG_MANAGER',
            },
            400,
          ],
          [
            {
              email: 'cust@task019.test',
              password: strongPassword,
              role: 'CUSTOMER',
            },
            400,
          ],
          [
            {
              email: 'x@task019.test',
              password: strongPassword,
              role: 'CATALOG_MANAGER',
              status: 'ACTIVE',
            },
            400,
          ],
          [
            {
              email: 'not-an-email',
              password: strongPassword,
              role: 'GENERAL_ADMIN',
            },
            400,
          ],
          [['array'], 400],
        ]
        for (const [body, status] of cases)
          expect(
            (
              await createUser(
                request('/api/admin/users', 'POST', tokens.general, body),
              )
            )?.status,
          ).toBe(status)
      })

      it('enforces a single role per user at the database level (RN-023)', async () => {
        await expect(
          testPool!.query(
            "INSERT INTO identity_user_roles (user_id,role_code) VALUES ($1,'GENERAL_ADMIN')",
            [ids.catalogManager],
          ),
        ).rejects.toMatchObject({ code: '23505' })
      })

      it('deactivating an account revokes its sessions and is audited', async () => {
        const user = await createAdmin(
          'to.deactivate@task019.test',
          'CATALOG_MANAGER',
        )
        const token = await authenticate(
          'to.deactivate@task019.test',
          strongPassword,
        )
        expect(await principalFromCookie(token)).not.toBeNull()

        const response = await updateUser(
          request(`/api/admin/users/${user.id}`, 'PATCH', tokens.general, {
            status: 'INACTIVE',
          }),
          userContext(user.id),
        )
        expect(response!.status).toBe(200)
        expect((await response!.json()).user).toMatchObject({
          status: 'INACTIVE',
        })
        const sessions = await testPool!.query<{ open: string }>(
          `SELECT count(*)::text AS open FROM identity_sessions
            WHERE user_id=$1 AND revoked_at IS NULL`,
          [user.id],
        )
        expect(sessions.rows[0]?.open).toBe('0')
        expect(await principalFromCookie(token)).toBeNull()
        expect((await auditRows(user.id)).at(-1)).toMatchObject({
          action: 'USER_UPDATED',
          actor_id: ids.generalAdmin,
          result: 'SUCCESS',
          metadata: { reasonCode: 'STATUS_INACTIVE' },
        })
      })

      it('changes the role keeping exactly one role and audits it', async () => {
        const user = await createAdmin(
          'promoted@task019.test',
          'CATALOG_MANAGER',
        )
        const response = await updateUser(
          request(`/api/admin/users/${user.id}`, 'PATCH', tokens.general, {
            role: 'GENERAL_ADMIN',
          }),
          userContext(user.id),
        )
        expect(response!.status).toBe(200)
        expect((await response!.json()).user.role).toBe('GENERAL_ADMIN')
        const roles = await testPool!.query<{ role_code: string }>(
          'SELECT role_code FROM identity_user_roles WHERE user_id=$1',
          [user.id],
        )
        expect(roles.rows.map((row) => row.role_code)).toEqual([
          'GENERAL_ADMIN',
        ])
        expect((await auditRows(user.id)).at(-1)).toMatchObject({
          action: 'USER_ROLE_CHANGED',
          result: 'SUCCESS',
          metadata: { reasonCode: 'GENERAL_ADMIN' },
        })
        // Return the scenario to a single active GENERAL_ADMIN for RN-022.
        expect(
          (
            await updateUser(
              request(`/api/admin/users/${user.id}`, 'PATCH', tokens.general, {
                status: 'INACTIVE',
              }),
              userContext(user.id),
            )
          )?.status,
        ).toBe(200)
      })

      it('refuses to deactivate or demote the last active GENERAL_ADMIN (RN-022)', async () => {
        for (const body of [
          { status: 'INACTIVE' },
          { role: 'CATALOG_MANAGER' },
          { status: 'INACTIVE', role: 'CATALOG_MANAGER' },
        ]) {
          const response = await updateUser(
            request(
              `/api/admin/users/${ids.generalAdmin}`,
              'PATCH',
              tokens.general,
              body,
            ),
            userContext(ids.generalAdmin),
          )
          expect(response!.status).toBe(409)
          expect((await response!.json()).code).toBe('LAST_GENERAL_ADMIN')
        }
        const stored = await testPool!.query<{ status: string; role: string }>(
          `SELECT u.status,ur.role_code AS role FROM identity_users u
             JOIN identity_user_roles ur ON ur.user_id=u.id WHERE u.id=$1`,
          [ids.generalAdmin],
        )
        expect(stored.rows[0]).toEqual({
          status: 'ACTIVE',
          role: 'GENERAL_ADMIN',
        })
        expect((await auditRows(ids.generalAdmin)).at(-1)).toMatchObject({
          result: 'FAILURE',
          actor_id: ids.generalAdmin,
          metadata: { reasonCode: 'LAST_GENERAL_ADMIN' },
        })
        // Keeping it ACTIVE (a no-op) is allowed.
        expect(
          (
            await updateUser(
              request(
                `/api/admin/users/${ids.generalAdmin}`,
                'PATCH',
                tokens.general,
                { status: 'ACTIVE', role: 'GENERAL_ADMIN' },
              ),
              userContext(ids.generalAdmin),
            )
          )?.status,
        ).toBe(200)
      })

      it('does not manage customer accounts and validates the change', async () => {
        for (const userId of [ids.customer, randomUUID(), 'not-a-uuid'])
          expect(
            (
              await updateUser(
                request(`/api/admin/users/${userId}`, 'PATCH', tokens.general, {
                  status: 'INACTIVE',
                }),
                userContext(userId),
              )
            )?.status,
          ).toBe(404)
        for (const body of [
          { status: 'SUSPENDED' },
          { role: 'CUSTOMER' },
          { email: 'x@task019.test' },
          { password: strongPassword },
          {},
        ])
          expect(
            (
              await updateUser(
                request(
                  `/api/admin/users/${ids.catalogManager}`,
                  'PATCH',
                  tokens.general,
                  body,
                ),
                userContext(ids.catalogManager),
              )
            )?.status,
          ).toBe(400)
      })

      it('denies CATALOG_MANAGER and CUSTOMER (403) and anonymous users (401) without escalation', async () => {
        for (const [token, status] of [
          [tokens.catalog, 403],
          [tokens.customer, 403],
          [undefined, 401],
        ] as const) {
          expect(
            (await listUsers(request('/api/admin/users', 'GET', token)))
              ?.status,
          ).toBe(status)
          expect(
            (
              await createUser(
                request('/api/admin/users', 'POST', token, {
                  email: `escalate-${randomUUID()}@task019.test`,
                  password: strongPassword,
                  role: 'GENERAL_ADMIN',
                }),
              )
            )?.status,
          ).toBe(status)
          expect(
            (
              await updateUser(
                request(
                  `/api/admin/users/${ids.catalogManager}`,
                  'PATCH',
                  token,
                  {
                    role: 'GENERAL_ADMIN',
                  },
                ),
                userContext(ids.catalogManager),
              )
            )?.status,
          ).toBe(status)
        }
        const role = await testPool!.query<{ role_code: string }>(
          'SELECT role_code FROM identity_user_roles WHERE user_id=$1',
          [ids.catalogManager],
        )
        expect(role.rows[0]?.role_code).toBe('CATALOG_MANAGER')
      })

      it('serializes concurrent changes so one active GENERAL_ADMIN always remains', async () => {
        // At this point `general@` is the only active GENERAL_ADMIN. Add a
        // second one and deactivate both at the same time through the
        // repository (no HTTP authorization step in between): the advisory
        // lock must let exactly one change through.
        const second = await createAdmin(
          'second.general@task019.test',
          'GENERAL_ADMIN',
        )
        const repository = new PostgresAdminAccountRepository()
        const results = await Promise.allSettled(
          [ids.generalAdmin, second.id].map((userId) =>
            repository.update(ids.generalAdmin, userId, { status: 'INACTIVE' }),
          ),
        )
        expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
        const rejected = results.find((r) => r.status === 'rejected')
        expect(rejected).toMatchObject({
          reason: { code: 'LAST_GENERAL_ADMIN' },
        })
        const active = await testPool!.query<{ total: string }>(
          `SELECT count(*)::text AS total FROM identity_users u
             JOIN identity_user_roles ur ON ur.user_id=u.id
            WHERE u.status='ACTIVE' AND ur.role_code='GENERAL_ADMIN'`,
        )
        expect(active.rows[0]?.total).toBe('1')
      })
    })
  },
)
