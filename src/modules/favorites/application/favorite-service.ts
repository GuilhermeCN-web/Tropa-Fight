import { FavoriteError } from '../domain/favorite'
import type { FavoriteRepository } from './favorite-repository'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireUuid(value: string): string {
  if (!uuidPattern.test(value))
    throw new FavoriteError('Invalid ID.', 'VALIDATION')
  return value
}

export class FavoriteService {
  private readonly repository: FavoriteRepository

  constructor(repository: FavoriteRepository) {
    this.repository = repository
  }

  add(customerId: string, productId: string) {
    return this.repository.add(requireUuid(customerId), requireUuid(productId))
  }

  remove(customerId: string, productId: string) {
    return this.repository.remove(
      requireUuid(customerId),
      requireUuid(productId),
    )
  }

  listForCustomer(customerId: string) {
    return this.repository.listForCustomer(requireUuid(customerId))
  }
}
