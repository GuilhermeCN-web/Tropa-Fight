import type { Metadata } from 'next'
import { CartView } from '../../src/modules/cart/presentation/cart-view'

export const metadata: Metadata = { title: 'Carrinho — Tropa Fight' }

export default function CartPage() {
  return <CartView />
}
