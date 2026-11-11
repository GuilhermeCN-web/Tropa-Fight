import type { Metadata } from 'next'
import { OrderListView } from '../../src/modules/orders/presentation/order-views'

export const metadata: Metadata = { title: 'Meus pedidos — Tropa Fight' }

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)
  return raw && /^\d+$/.test(raw) && Number.isSafeInteger(page) && page >= 1
    ? page
    : 1
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { page } = await searchParams
  return <OrderListView page={readPage(page)} />
}
