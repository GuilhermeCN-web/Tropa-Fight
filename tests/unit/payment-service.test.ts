import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { PaymentService } from '../../src/modules/payments/application/payment-service'
import type {
  PaymentGateway,
  PaymentRepository,
} from '../../src/modules/payments/application/payment-ports'
import type { Payment } from '../../src/modules/payments/domain/payment'

describe('PaymentService gateway timeout handling', () => {
  it('keeps a failed gateway attempt from creating a payment and retries idempotently', async () => {
    const customerId = randomUUID()
    const orderId = randomUUID()
    const idempotencyKey = randomUUID()
    let persistedPayment: Payment | null = null
    let gatewayAttempts = 0
    let persistedPayments = 0

    const repository: PaymentRepository = {
      async findByIdempotencyKey() {
        return persistedPayment
      },
      async getPayableOrder() {
        return { amountCents: 6500, currency: 'BRL' }
      },
      async createPayment(input) {
        persistedPayments += 1
        persistedPayment = {
          id: randomUUID(),
          orderId: input.orderId,
          provider: 'LOCAL_MOCK',
          providerPaymentId: input.providerPaymentId,
          method: input.method,
          amountCents: input.amountCents,
          currency: input.currency,
          status: 'PENDING',
          idempotencyKey: input.idempotencyKey,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paidAt: null,
        }
        return { payment: persistedPayment, created: true }
      },
      async getPayment() {
        return null
      },
      async processWebhook() {
        return { kind: 'rejected' }
      },
    }

    const gateway: PaymentGateway = {
      async createPayment() {
        gatewayAttempts += 1
        if (gatewayAttempts === 1) throw new Error('Simulated timeout')
        return { providerPaymentId: `local-${randomUUID()}` }
      },
    }
    const service = new PaymentService(repository, gateway)
    const input = { orderId, method: 'PIX' as const }

    await expect(
      service.createPayment(customerId, input, idempotencyKey),
    ).rejects.toThrow('Simulated timeout')
    expect(persistedPayments).toBe(0)

    const retry = await service.createPayment(customerId, input, idempotencyKey)
    expect(retry.created).toBe(true)
    expect(persistedPayments).toBe(1)

    const replay = await service.createPayment(
      customerId,
      input,
      idempotencyKey,
    )
    expect(replay.created).toBe(false)
    expect(replay.payment.id).toBe(retry.payment.id)
    expect(gatewayAttempts).toBe(2)
    expect(persistedPayments).toBe(1)
  })
})
