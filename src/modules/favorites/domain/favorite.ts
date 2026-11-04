export type Favorite = {
  id: string
  customerId: string
  productId: string
  productName: string
  productPublicationState: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: string
}

export class FavoriteError extends Error {
  readonly code: 'VALIDATION' | 'NOT_FOUND'

  constructor(message: string, code: FavoriteError['code']) {
    super(message)
    this.code = code
    this.name = 'FavoriteError'
  }
}
