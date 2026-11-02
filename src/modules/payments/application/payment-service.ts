import {
  PaymentError,
  type CreatePaymentInput,
  type PaymentWebhookEvent,
} from '../domain/payment'
import type {
  PaymentGateway,
  PaymentRepository,
  PaymentCreationResult,
  WebhookProcessingResult,
} from './payment-ports'

export class PaymentService {
  private readonly repository: PaymentRepository
  private readonly gateway: PaymentGateway

  constructor(repository: PaymentRepository, gateway: PaymentGateway) {
    this.repository = repository
    this.gateway = gateway
  }

  async createPayment(
    customerId: string,
    input: CreatePaymentInput,
    idempotencyKey: string,
  ): Promise<PaymentCreationResult> {
    const existing = await this.repository.findByIdempotencyKey(
      customerId,
      idempotencyKey,
    )
    if (existing) {
      if (
        existing.orderId !== input.orderId ||
        existing.method !== input.method
      )
        throw new PaymentError(
          'Idempotency key was already used for a different payment request.',
          'CONFLICT',
        )
      return { payment: existing, created: false }
    }

    const order = await this.repository.getPayableOrder(
      customerId,
      input.orderId,
    )
    const gatewayPayment = await this.gateway.createPayment({
      orderId: input.orderId,
      amountCents: order.amountCents,
      currency: order.currency,
      method: input.method,
      idempotencyKey,
    })
    return this.repository.createPayment({
      customerId,
      orderId: input.orderId,
      method: input.method,
      amountCents: order.amountCents,
      currency: order.currency,
      idempotencyKey,
      providerPaymentId: gatewayPayment.providerPaymentId,
    })
  }

  getPayment(customerId: string, paymentId: string) {
    return this.repository.getPayment(customerId, paymentId)
  }

  processWebhook(event: PaymentWebhookEvent): Promise<WebhookProcessingResult> {
    return this.repository.processWebhook(event)
  }
}
