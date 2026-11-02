import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import {
  normalizeCreatePaymentInput,
  parsePaymentWebhookEvent,
  PaymentError,
  type PaymentWebhookEvent,
} from '../domain/payment'
import { PaymentService } from '../application/payment-service'
import { LocalMockPaymentGateway } from '../infrastructure/local-mock-payment-gateway'
import { PostgresPaymentRepository } from '../infrastructure/postgres-payment-repository'
import { verifyPaymentWebhookSignature } from '../infrastructure/webhook-signature'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { recordAuditEvent } from '../../audit/infrastructure/audit-repository'

const service = new PaymentService(
  new PostgresPaymentRepository(),
  new LocalMockPaymentGateway(),
)
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function customer(request: NextRequest) {
  const access = await requirePermission(request, 'identity.profile.read:self')
  if (
    access.kind === 'authorized' &&
    access.principal.accountType === 'CUSTOMER'
  )
    return { id: access.principal.id }
  return {
    response: NextResponse.json(
      {
        error:
          access.kind === 'unauthenticated'
            ? 'Authentication required.'
            : 'Permission denied.',
      },
      {
        status: access.kind === 'unauthenticated' ? 401 : 403,
        headers: { 'Cache-Control': 'no-store' },
      },
    ),
  }
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function responseForError(error: unknown) {
  if (error instanceof PaymentError) {
    const status =
      error.code === 'VALIDATION'
        ? 400
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT' || error.code === 'EXPIRED'
            ? 409
            : 503
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(
    { error: 'Unable to process payment.' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}

function publicPayment(
  payment: Awaited<ReturnType<PaymentService['getPayment']>>,
) {
  if (!payment) return null
  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    amountCents: payment.amountCents,
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    paidAt: payment.paidAt,
  }
}

export async function createPayment(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response

  try {
    const input = normalizeCreatePaymentInput(await readJson(request))
    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey || !uuidPattern.test(idempotencyKey))
      return NextResponse.json(
        { error: 'A valid Idempotency-Key is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )

    const result = await service.createPayment(access.id, input, idempotencyKey)
    return NextResponse.json(
      { payment: publicPayment(result.payment) },
      {
        status: result.created ? 201 : 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    return responseForError(error)
  }
}

export async function getPayment(request: NextRequest, paymentId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  if (!uuidPattern.test(paymentId))
    return NextResponse.json(
      { error: 'Payment not found.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  try {
    const payment = await service.getPayment(access.id, paymentId)
    if (!payment)
      return NextResponse.json(
        { error: 'Payment not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    return NextResponse.json(
      { payment: publicPayment(payment) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return responseForError(error)
  }
}

async function auditWebhookRejection(
  reasonCode: 'PAYLOAD_TOO_LARGE' | 'INVALID_SIGNATURE' | 'INVALID_PAYLOAD',
) {
  await recordAuditEvent(
    createAuditEvent({
      actorId: null,
      action: 'PAYMENT_WEBHOOK_REJECTED',
      resourceType: 'Payment',
      resourceId: null,
      result: 'FAILURE',
      source: 'payments.webhook',
      metadata: { reasonCode },
    }),
  )
}

export async function receivePaymentWebhook(request: NextRequest) {
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json(
      { error: 'Invalid webhook request.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (Buffer.byteLength(rawBody, 'utf8') > 16_384) {
    await auditWebhookRejection('PAYLOAD_TOO_LARGE')
    return NextResponse.json(
      { error: 'Webhook payload is too large.' },
      { status: 413, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const signatureIsValid = verifyPaymentWebhookSignature(
      rawBody,
      request.headers.get('x-payment-signature'),
    )
    if (!signatureIsValid) {
      await auditWebhookRejection('INVALID_SIGNATURE')
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    let event: PaymentWebhookEvent
    try {
      event = parsePaymentWebhookEvent(rawBody)
    } catch (error) {
      if (!(error instanceof PaymentError)) throw error
      await auditWebhookRejection('INVALID_PAYLOAD')
      return responseForError(error)
    }
    const result = await service.processWebhook(event)
    if (result.kind === 'rejected')
      return NextResponse.json(
        { error: 'Payment webhook was rejected.', code: result.reason },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      )
    return NextResponse.json(
      { received: true, duplicate: result.kind === 'duplicate' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return responseForError(error)
  }
}
