import type { NextRequest } from 'next/server'
import { getPayment } from '../../../../src/modules/payments/presentation/payment-http'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params
  return getPayment(request, paymentId)
}
