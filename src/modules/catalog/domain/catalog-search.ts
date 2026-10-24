import { CatalogError, requireUuid } from './catalog'

export const catalogSearchSorts = [
  'name_asc',
  'name_desc',
  'price_asc',
  'price_desc',
] as const

export type CatalogSearchSort = (typeof catalogSearchSorts)[number]

export type CatalogSearchInput = {
  q?: string
  categoryId?: string
  brandId?: string
  minPriceCents?: string
  maxPriceCents?: string
  sort?: string
  page?: string
  pageSize?: string
}

export type CatalogSearchQuery = {
  q?: string
  categoryId?: string
  brandId?: string
  minPriceCents?: number
  maxPriceCents?: number
  sort: CatalogSearchSort
  page: number
  pageSize: number
}

export type CatalogSearchProduct = {
  id: string
  name: string
  description: string | null
  brand: { id: string; name: string }
  categories: Array<{ id: string; name: string }>
  priceCents: number
}

export type CatalogSearchResult = {
  items: CatalogSearchProduct[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function integerParameter(
  name: string,
  value: string | undefined,
  defaultValue?: number,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number | undefined {
  if (value === undefined || value.trim() === '') return defaultValue
  if (!/^\d+$/.test(value.trim())) {
    throw new CatalogError(`${name} must be a whole number.`, 'VALIDATION')
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new CatalogError(
      `${name} is outside the allowed range.`,
      'VALIDATION',
    )
  }
  return parsed
}

export function normalizeCatalogSearch(
  input: CatalogSearchInput,
): CatalogSearchQuery {
  const q = optionalValue(input.q)?.replace(/\s+/g, ' ')
  const categoryId = optionalValue(input.categoryId)
  const brandId = optionalValue(input.brandId)
  const minPriceCents = integerParameter(
    'minPriceCents',
    optionalValue(input.minPriceCents),
  )
  const maxPriceCents = integerParameter(
    'maxPriceCents',
    optionalValue(input.maxPriceCents),
  )
  const page = integerParameter('page', input.page, 1, 1)!
  const pageSize = integerParameter('pageSize', input.pageSize, 20, 1, 100)!
  const requestedSort = optionalValue(input.sort) ?? 'name_asc'

  if (!catalogSearchSorts.includes(requestedSort as CatalogSearchSort)) {
    throw new CatalogError('Unsupported sort order.', 'VALIDATION')
  }
  if (categoryId) requireUuid(categoryId)
  if (brandId) requireUuid(brandId)
  if (
    minPriceCents !== undefined &&
    maxPriceCents !== undefined &&
    minPriceCents > maxPriceCents
  ) {
    throw new CatalogError(
      'Minimum price cannot exceed maximum price.',
      'VALIDATION',
    )
  }
  if (!Number.isSafeInteger((page - 1) * pageSize)) {
    throw new CatalogError(
      'Page offset is outside the allowed range.',
      'VALIDATION',
    )
  }

  return {
    ...(q ? { q } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
    ...(minPriceCents === undefined ? {} : { minPriceCents }),
    ...(maxPriceCents === undefined ? {} : { maxPriceCents }),
    sort: requestedSort as CatalogSearchSort,
    page,
    pageSize,
  }
}
