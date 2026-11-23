// Local TLS front for the E2E server (TASK-021).
//
// The session cookie is always `Secure` (ADR-012). WebKit/Safari refuses
// Secure cookies on plain http://localhost, so the E2E suite talks to the app
// through HTTPS, as a real deployment would. A throwaway self-signed
// certificate is generated with OpenSSL for each run; nothing is persisted.
//
// Usage: node tests/e2e/https-proxy.mjs <httpsPort> <targetHttpPort>
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import os from 'node:os'
import path from 'node:path'

const [listenPort, targetPort] = process.argv.slice(2).map(Number)
if (!listenPort || !targetPort)
  throw new Error('Usage: https-proxy.mjs <httpsPort> <targetHttpPort>')

const directory = mkdtempSync(path.join(os.tmpdir(), 'tropa-e2e-tls-'))
const keyPath = path.join(directory, 'key.pem')
const certPath = path.join(directory, 'cert.pem')
execFileSync(
  'openssl',
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-days',
    '1',
    '-subj',
    '/CN=localhost',
    '-addext',
    'subjectAltName=DNS:localhost,IP:127.0.0.1',
    '-keyout',
    keyPath,
    '-out',
    certPath,
  ],
  { stdio: 'ignore' },
)
const credentials = { key: readFileSync(keyPath), cert: readFileSync(certPath) }
rmSync(directory, { recursive: true, force: true })

const server = https.createServer(credentials, (request, response) => {
  const upstream = http.request(
    {
      host: '127.0.0.1',
      port: targetPort,
      method: request.method,
      path: request.url,
      headers: { ...request.headers, 'x-forwarded-proto': 'https' },
    },
    (upstreamResponse) => {
      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.headers,
      )
      upstreamResponse.pipe(response)
    },
  )
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502)
    response.end()
  })
  request.pipe(upstream)
})

server.listen(listenPort, 'localhost', () => {
  process.stdout.write(`E2E HTTPS proxy on https://localhost:${listenPort}\n`)
})
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)))
