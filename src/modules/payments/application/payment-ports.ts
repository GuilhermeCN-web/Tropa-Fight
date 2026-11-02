import type {
  Payment,
  PaymentMethod,
  PaymentWebhookEvent,
} from '../domain/payment'

export type PayableOrder = {
  amountCents: number
  currency: 'BRL'
}

export type PaymentCreationResult = {
  payment: Payment
  created: boolean
}

export type WebhookProcessingResult = {
  kind: 'processed' | 'duplicate' | 'stale' | 'rejected'
  payment?: Payment
  reason?: string
}

export interface PaymentGateway {
  createPayment(input: {
    orderId: string
    amountCents: number
    currency: 'BRL'
    method: PaymentMethod
    idempotencyKey: string
  }): Promise<{ providerPaymentId: string }>
}

export interface PaymentRepository {
  findByIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
  ): Promise<Payment | null>
  getPayableOrder(customerId: string, orderId: string): Promise<PayableOrder>
  createPayment(input: {
    customerId: string
    orderId: string
    method: PaymentMethod
    amountCents: number
    currency: 'BRL'
    idempotencyKey: string
    providerPaymentId: string
  }): Promise<PaymentCreationResult>
  getPayment(customerId: string, paymentId: string): Promise<Payment | null>
  processWebhook(event: PaymentWebhookEvent): Promise<WebhookProcessingResult>
}
