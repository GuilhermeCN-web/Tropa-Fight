import { CatalogError } from './catalog'

export type ProductVariantStatus = 'ACTIVE' | 'INACTIVE'
export type ProductVariantAttributes = Partial<{
  size: string
  color: string
}>

export type ProductVariant = {
  id: string
  productId: string
  sku: string
  attributes: ProductVariantAttributes
  priceCents: number
  currency: 'BRL'
  status: ProductVariantStatus
  createdAt: string
  updatedAt: string
}

export type PublicProductVariant = Omit<ProductVariant, 'sku'> & {
  commerciallyAvailable: true
}

export function normalizeSku(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new CatalogError('SKU is required.', 'VALIDATION')
  }
  return value
}

export function normalizeVariantAttributes(
  value: unknown,
): ProductVariantAttributes {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CatalogError('Attributes must be an object.', 'VALIDATION')
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw new CatalogError('Attributes must be a plain object.', 'VALIDATION')
  }

  const entries = Object.entries(value)
  if (entries.some(([key]) => key !== 'size' && key !== 'color')) {
    throw new CatalogError(
      'Only size and color attributes are supported.',
      'VALIDATION',
    )
  }

  const attributes: ProductVariantAttributes = {}
  for (const key of ['size', 'color'] as const) {
    const attribute = (value as Record<string, unknown>)[key]
    if (attribute === undefined) continue
    if (typeof attribute !== 'string' || attribute.trim().length === 0) {
      throw new CatalogError(
        `Attribute ${key} must be a non-empty string.`,
        'VALIDATION',
      )
    }
    attributes[key] = attribute.trim()
  }
  return attributes
}

export function normalizePriceCents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new CatalogError(
      'Price must be a non-negative integer number of centavos.',
      'VALIDATION',
    )
  }
  return value
}

export function requireVariantStatus(value: unknown): ProductVariantStatus {
  if (value !== 'ACTIVE' && value !== 'INACTIVE') {
    throw new CatalogError('Status must be ACTIVE or INACTIVE.', 'VALIDATION')
  }
  return value
}
