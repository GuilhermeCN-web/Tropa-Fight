import { randomUUID } from 'node:crypto'
import type { PaymentGateway } from '../application/payment-ports'

export class LocalMockPaymentGateway implements PaymentGateway {
  async createPayment(_input: Parameters<PaymentGateway['createPayment']>[0]) {
    return { providerPaymentId: `local-${randomUUID()}` }
  }
}
