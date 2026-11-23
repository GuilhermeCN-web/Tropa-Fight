import { randomBytes } from 'node:crypto'
import { defineConfig, devices } from '@playwright/test'

/**
 * E2E configuration (TASK-021, RNF-023).
 *
 * - Runs against a production build (`next build` + `next start`) on port 3100.
 * - Uses a dedicated database (`E2E_DATABASE_URL`, default: the Docker Compose
 *   PostgreSQL on 5433 with the local-only default credentials). The global
 *   setup creates it if missing, applies the migrations and seeds fixtures.
 * - A webhook secret is generated per run and shared with the server, so the
 *   payment approval can be simulated exactly like `npm run payment:simulate`.
 */
process.env.E2E_DATABASE_URL ??=
  'postgresql://tropa:tropa_local@localhost:5433/tropa_fight_e2e'
process.env.E2E_WEBHOOK_SECRET ??= randomBytes(32).toString('hex')

const port = 3100
const httpsPort = 3443
// The session cookie is always `Secure`; WebKit only keeps it over HTTPS, so
// the browsers reach the app through a local TLS proxy (tests/e2e/https-proxy.mjs).
export const baseURL = `https://localhost:${httpsPort}`

// 360 px is the minimum width required by RNF-021.
const narrow = { viewport: { width: 360, height: 780 } }

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'pt-BR',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'chromium-360',
      use: { ...devices['Desktop Chrome'], ...narrow },
      grepInvert: /@api/,
    },
    {
      name: 'firefox-360',
      use: { ...devices['Desktop Firefox'], ...narrow },
      grepInvert: /@api/,
    },
    {
      name: 'webkit-360',
      use: { ...devices['Desktop Safari'], ...narrow },
      grepInvert: /@api/,
    },
  ],
  webServer: [
    {
      command: `npx next build && npx next start -p ${port}`,
      // Readiness probe independent of the database, so it does not matter
      // whether the server starts before or after the global setup.
      url: `http://localhost:${port}/login`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: process.env.E2E_DATABASE_URL,
        PAYMENT_WEBHOOK_SECRET: process.env.E2E_WEBHOOK_SECRET,
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: `node tests/e2e/https-proxy.mjs ${httpsPort} ${port}`,
      url: `${baseURL}/login`,
      ignoreHTTPSErrors: true,
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
})
