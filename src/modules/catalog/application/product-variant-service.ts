import { CatalogError, requireUuid } from '../domain/catalog'
import {
  normalizePriceCents,
  normalizeSku,
  normalizeVariantAttributes,
  requireVariantStatus,
} from '../domain/product-variant'
import type {
  ProductVariantRepository,
  ProductVariantUpdate,
} from './product-variant-repository'

export class ProductVariantService {
  private readonly repository: ProductVariantRepository

  constructor(repository: ProductVariantRepository) {
    this.repository = repository
  }

  create(
    productId: string,
    input: {
      sku: unknown
      attributes: unknown
      priceCents: unknown
      status: unknown
    },
    actorId: string,
  ) {
    return this.repository.create(
      requireUuid(productId),
      {
        sku: normalizeSku(input.sku),
        attributes: normalizeVariantAttributes(input.attributes),
        priceCents: normalizePriceCents(input.priceCents),
        status: requireVariantStatus(input.status),
      },
      actorId,
    )
  }

  listByProduct(productId: string) {
    return this.repository.listByProduct(requireUuid(productId))
  }

  listPublicByProduct(productId: string) {
    return this.repository.listPublicByProduct(requireUuid(productId))
  }

  getById(id: string) {
    return this.repository.getById(requireUuid(id))
  }

  update(id: string, input: Record<string, unknown>, actorId: string) {
    const update: ProductVariantUpdate = {}
    if (input.sku !== undefined) update.sku = normalizeSku(input.sku)
    if (input.attributes !== undefined)
      update.attributes = normalizeVariantAttributes(input.attributes)
    if (input.priceCents !== undefined)
      update.priceCents = normalizePriceCents(input.priceCents)
    if (input.status !== undefined)
      update.status = requireVariantStatus(input.status)
    if (Object.keys(update).length === 0) {
      throw new CatalogError(
        'At least one variant field is required.',
        'VALIDATION',
      )
    }
    return this.repository.update(requireUuid(id), update, actorId)
  }
}
