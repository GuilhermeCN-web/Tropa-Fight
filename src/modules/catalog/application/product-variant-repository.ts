import type {
  ProductVariant,
  ProductVariantAttributes,
  ProductVariantStatus,
  PublicProductVariant,
} from '../domain/product-variant'

export type ProductVariantInput = {
  sku: string
  attributes: ProductVariantAttributes
  priceCents: number
  status: ProductVariantStatus
}

export type ProductVariantUpdate = Partial<ProductVariantInput>

export interface ProductVariantRepository {
  create(
    productId: string,
    input: ProductVariantInput,
    actorId: string,
  ): Promise<ProductVariant>
  listByProduct(productId: string): Promise<ProductVariant[]>
  listPublicByProduct(productId: string): Promise<PublicProductVariant[]>
  getById(id: string): Promise<ProductVariant | null>
  update(
    id: string,
    input: ProductVariantUpdate,
    actorId: string,
  ): Promise<ProductVariant>
}
