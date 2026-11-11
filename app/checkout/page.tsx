import type { Metadata } from 'next'
import { CheckoutView } from '../../src/modules/checkout/presentation/checkout-view'

export const metadata: Metadata = { title: 'Checkout — Tropa Fight' }

export default function CheckoutPage() {
  return <CheckoutView />
}
