import {
  CatalogError,
  normalizeDescription,
  normalizeName,
  requireCategoryIds,
  requireUuid,
} from '../domain/catalog'
import type {
  CatalogRepository,
  EntityUpdate,
  ProductUpdate,
} from './catalog-repository'

export class CatalogService {
  private readonly repository: CatalogRepository

  constructor(repository: CatalogRepository) {
    this.repository = repository
  }

  createCategory(name: string, actorId: string) {
    return this.repository.createCategory(
      { name: normalizeName(name, 50) },
      actorId,
    )
  }

  updateCategory(id: string, input: EntityUpdate, actorId: string) {
    return this.repository.updateCategory(
      requireUuid(id),
      {
        ...(input.name === undefined
          ? {}
          : { name: normalizeName(input.name, 50) }),
        ...(input.status === undefined
          ? {}
          : { status: this.requireStatus(input.status) }),
      },
      actorId,
    )
  }

  getCategory(id: string) {
    return this.repository.getCategory(requireUuid(id))
  }
  listCategories() {
    return this.repository.listCategories()
  }

  createBrand(name: string, actorId: string) {
    return this.repository.createBrand(
      { name: normalizeName(name, 50) },
      actorId,
    )
  }

  updateBrand(id: string, input: EntityUpdate, actorId: string) {
    return this.repository.updateBrand(
      requireUuid(id),
      {
        ...(input.name === undefined
          ? {}
          : { name: normalizeName(input.name, 50) }),
        ...(input.status === undefined
          ? {}
          : { status: this.requireStatus(input.status) }),
      },
      actorId,
    )
  }

  getBrand(id: string) {
    return this.repository.getBrand(requireUuid(id))
  }
  listBrands() {
    return this.repository.listBrands()
  }

  createProduct(
    input: {
      name: string
      description?: string | null
      brandId: string
      categoryIds: string[]
    },
    actorId: string,
  ) {
    return this.repository.createProduct(
      {
        name: normalizeName(input.name, 100),
        description: normalizeDescription(input.description),
        brandId: requireUuid(input.brandId),
        categoryIds: requireCategoryIds(input.categoryIds),
      },
      actorId,
    )
  }

  updateProduct(id: string, input: ProductUpdate, actorId: string) {
    const normalized: ProductUpdate = {}
    if (input.name !== undefined)
      normalized.name = normalizeName(input.name, 100)
    if (input.description !== undefined)
      normalized.description = normalizeDescription(input.description)
    if (input.brandId !== undefined)
      normalized.brandId = requireUuid(input.brandId)
    if (input.categoryIds !== undefined)
      normalized.categoryIds = requireCategoryIds(input.categoryIds)
    if (Object.keys(normalized).length === 0)
      throw new CatalogError(
        'At least one product field is required.',
        'VALIDATION',
      )
    return this.repository.updateProduct(requireUuid(id), normalized, actorId)
  }

  publishProduct(id: string, actorId: string) {
    return this.repository.publishProduct(requireUuid(id), actorId)
  }
  archiveProduct(id: string, actorId: string) {
    return this.repository.archiveProduct(requireUuid(id), actorId)
  }
  getProduct(id: string) {
    return this.repository.getProduct(requireUuid(id))
  }
  listProducts() {
    return this.repository.listProducts()
  }
  getPublicProduct(id: string) {
    return this.repository.getPublicProduct(requireUuid(id))
  }
  listPublicProducts() {
    return this.repository.listPublicProducts()
  }

  private requireStatus(status: string) {
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new CatalogError('Status must be ACTIVE or INACTIVE.', 'VALIDATION')
    }
    return status
  }
}
