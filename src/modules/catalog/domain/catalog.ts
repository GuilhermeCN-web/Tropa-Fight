export type CatalogEntityStatus = 'ACTIVE' | 'INACTIVE'
export type ProductPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type CatalogCategory = {
  id: string
  name: string
  status: CatalogEntityStatus
  createdAt: string
  updatedAt: string
}

export type CatalogBrand = {
  id: string
  name: string
  status: CatalogEntityStatus
  createdAt: string
  updatedAt: string
}

export type CatalogProduct = {
  id: string
  name: string
  description: string | null
  brand: Pick<CatalogBrand, 'id' | 'name'>
  categories: Array<Pick<CatalogCategory, 'id' | 'name'>>
  publicationState: ProductPublicationState
  createdAt: string
  updatedAt: string
}

export class CatalogError extends Error {
  readonly code:
    'VALIDATION' | 'NOT_FOUND' | 'REFERENCE' | 'CONFLICT' | 'INVALID_TRANSITION'

  constructor(
    message: string,
    code:
      | 'VALIDATION'
      | 'NOT_FOUND'
      | 'REFERENCE'
      | 'CONFLICT'
      | 'INVALID_TRANSITION',
  ) {
    super(message)
    this.name = 'CatalogError'
    this.code = code
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function requireUuid(value: string): string {
  if (!uuidPattern.test(value)) {
    throw new CatalogError('Invalid ID.', 'VALIDATION')
  }
  return value
}

export function normalizeName(value: string, maximumLength: number): string {
  const name = value.trim()
  if (name.length < 1 || name.length > maximumLength) {
    throw new CatalogError(
      `Name must contain between 1 and ${maximumLength} characters.`,
      'VALIDATION',
    )
  }
  return name
}

export function normalizeDescription(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) return null
  const description = value.trim()
  if (description.length > 1000) {
    throw new CatalogError(
      'Description must not exceed 1000 characters.',
      'VALIDATION',
    )
  }
  return description || null
}

export function requireCategoryIds(values: string[]): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new CatalogError('At least one category is required.', 'VALIDATION')
  }
  const ids = values.map(requireUuid)
  if (new Set(ids).size !== ids.length) {
    throw new CatalogError(
      'Duplicate category IDs are not allowed.',
      'VALIDATION',
    )
  }
  return ids
}
