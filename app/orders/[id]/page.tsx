import type { Metadata } from 'next'
import { OrderDetailView } from '../../../src/modules/orders/presentation/order-views'

export const metadata: Metadata = { title: 'Pedido — Tropa Fight' }

type OrderPageProps = {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  return <OrderDetailView orderId={id} />
}
