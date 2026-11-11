// Simula, em ambiente LOCAL, um evento do provedor de pagamento simulado
// (LOCAL_MOCK), que não envia webhooks sozinho (TASK-023).
//
// Uso: npm run payment:simulate -- <paymentId> <evento>
//   <evento>: payment.processing | payment.approved | payment.failed |
//             payment.cancelled | payment.expired
//
// O script lê o pedido e o valor do pagamento no banco local (DATABASE_URL),
// assina o corpo com PAYMENT_WEBHOOK_SECRET (HMAC-SHA256, cabeçalho
// `x-payment-signature: sha256=<hex>`) e o envia ao webhook existente
// (`POST /api/payments/webhook`). Não cria endpoint nem altera o contrato.
// Destino padrão: http://localhost:3000; use PAYMENT_SIMULATE_URL para outra
// porta. Somente destinos locais são aceitos.
import { createHmac, randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export const paymentEventTypes = [
  'payment.processing',
  'payment.approved',
  'payment.failed',
  'payment.cancelled',
  'payment.expired',
]

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseArguments(argv) {
  const [paymentId, type] = argv
  if (!paymentId || !uuidPattern.test(paymentId))
    throw new Error('Informe um paymentId válido (UUID).')
  if (!paymentEventTypes.includes(type))
    throw new Error(`Evento inválido. Use: ${paymentEventTypes.join(' | ')}.`)
  return { paymentId, type }
}

export function assertLocalTarget(baseUrl) {
  const url = new URL(baseUrl)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('payment:simulate só envia eventos para a aplicação local.')
  return new URL('/api/payments/webhook', url)
}

export function buildWebhookEvent({ paymentId, orderId, amountCents, type }) {
  return {
    id: `local-sim-${randomUUID()}`,
    type,
    paymentId,
    orderId,
    amountCents,
    currency: 'BRL',
    occurredAt: new Date().toISOString(),
  }
}

export function signWebhookBody(rawBody, secret) {
  if (!secret) throw new Error('PAYMENT_WEBHOOK_SECRET é obrigatório.')
  return `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
}

async function loadPayment(paymentId) {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString)
    throw new Error('DATABASE_URL é obrigatório. Configure o .env.local.')
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({
    connectionString,
    application_name: 'tropa-fight-payment-simulator',
  })
  try {
    const result = await pool.query(
      'SELECT order_id, amount_cents::text AS amount_cents FROM payments WHERE id = $1',
      [paymentId],
    )
    const row = result.rows[0]
    if (!row) throw new Error('Pagamento não encontrado no banco local.')
    return { orderId: row.order_id, amountCents: Number(row.amount_cents) }
  } finally {
    await pool.end()
  }
}

async function main() {
  const { paymentId, type } = parseArguments(process.argv.slice(2))
  const target = assertLocalTarget(
    process.env.PAYMENT_SIMULATE_URL ?? 'http://localhost:3000',
  )
  const payment = await loadPayment(paymentId)
  const rawBody = JSON.stringify(
    buildWebhookEvent({ paymentId, type, ...payment }),
  )
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-payment-signature': signWebhookBody(
        rawBody,
        process.env.PAYMENT_WEBHOOK_SECRET,
      ),
    },
    body: rawBody,
  })
  const text = await response.text()
  process.stdout.write(`${type}: HTTP ${response.status} ${text}\n`)
  if (!response.ok) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 1
  })
