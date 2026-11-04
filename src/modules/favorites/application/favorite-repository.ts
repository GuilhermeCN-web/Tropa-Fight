import type { Favorite } from '../domain/favorite'

export interface FavoriteRepository {
  add(customerId: string, productId: string): Promise<Favorite>
  remove(customerId: string, productId: string): Promise<void>
  listForCustomer(customerId: string): Promise<Favorite[]>
}
