import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scrypt,
} from 'node:crypto'
import { expect, type Page } from '@playwright/test'
import pg from 'pg'

/** Stable fixture data seeded by `global-setup.ts` (TASK-021). */
export const seed = {
  password: 'Tropa#E2e2026',
  generalAdmin: {
    id: '0e2e0000-0000-4000-8000-000000000001',
    email: 'e2e-admin@tropa.test',
  },
  catalogManager: {
    id: '0e2e0000-0000-4000-8000-000000000002',
    email: 'e2e-catalogo@tropa.test',
  },
  category: '0e2e0000-0000-4000-8000-000000000010',
  brand: '0e2e0000-0000-4000-8000-000000000011',
  product: {
    id: '0e2e0000-0000-4000-8000-000000000020',
    name: 'Luva E2E Tropa',
  },
  variantInStock: {
    id: '0e2e0000-0000-4000-8000-000000000021',
    sku: 'E2E-LUVA-12OZ',
    priceCents: 15_000,
  },
  variantOutOfStock: {
    id: '0e2e0000-0000-4000-8000-000000000022',
    sku: 'E2E-LUVA-16OZ',
    priceCents: 16_000,
  },
  promotion: '0e2e0000-0000-4000-8000-000000000030',
  coupon: { id: '0e2e0000-0000-4000-8000-000000000031', code: 'E2E10' },
} as const

export function databaseUrl(): string {
  const url = process.env.E2E_DATABASE_URL
  if (!url) throw new Error('E2E_DATABASE_URL is not configured.')
  return url
}

export async function withDatabase<T>(
  work: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    return await work(client)
  } finally {
    await client.end()
  }
}

/** Same encoding as `src/modules/identity/infrastructure/password-hasher.ts`. */
export function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error)
        else
          resolve(
            [
              'scrypt',
              16_384,
              8,
              1,
              salt.toString('hex'),
              key.toString('hex'),
            ].join('$'),
          )
      },
    )
  })
}

/**
 * Test-only shortcut for the recovery e-mail, which has no provider in the
 * V1: stores a known reset token (hashed like the repository does).
 */
export async function createResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await withDatabase((client) =>
    client.query(
      `INSERT INTO identity_password_reset_tokens (id,user_id,token_hash,expires_at)
       SELECT $1,id,$2,now()+interval '30 minutes' FROM identity_users WHERE lower(email)=$3`,
      [
        randomUUID(),
        createHash('sha256').update(token).digest('hex'),
        email.toLowerCase(),
      ],
    ),
  )
  return token
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@e2e.test`
}

/** Signs a payment webhook exactly like `scripts/simulate-payment-webhook.mjs`. */
export function signedWebhook(event: Record<string, unknown>) {
  const secret = process.env.E2E_WEBHOOK_SECRET
  if (!secret) throw new Error('E2E_WEBHOOK_SECRET is not configured.')
  const body = JSON.stringify(event)
  return {
    body,
    signature: `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`,
  }
}

export async function registerViaUi(
  page: Page,
  email: string,
  password: string = seed.password,
) {
  await page.goto('/register')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('status')).not.toBeEmpty()
}

export async function loginViaUi(
  page: Page,
  email: string,
  password: string = seed.password,
) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/profile')
}

/** No horizontal page scroll at the current viewport (RNF-021). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(1)
}
