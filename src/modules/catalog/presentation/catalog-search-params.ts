import { CatalogError } from '../domain/catalog'
import type { CatalogSearchInput } from '../domain/catalog-search'

const supportedParameters = new Set([
  'q',
  'categoryId',
  'brandId',
  'minPriceCents',
  'maxPriceCents',
  'sort',
  'page',
  'pageSize',
])

export function readCatalogSearchParams(
  params: URLSearchParams,
  options: { displayPricesInReais?: boolean } = {},
): CatalogSearchInput {
  const inputParams = new URLSearchParams(params)
  if (options.displayPricesInReais) {
    for (const [displayName, apiName] of [
      ['minPrice', 'minPriceCents'],
      ['maxPrice', 'maxPriceCents'],
    ]) {
      const displayValues = inputParams.getAll(displayName)
      if (displayValues.length === 0) continue
      if (displayValues.length !== 1) {
        throw new CatalogError(
          `Invalid ${displayName} parameter.`,
          'VALIDATION',
        )
      }
      const value = displayValues[0]!
      if (value.trim() === '') {
        inputParams.delete(displayName)
        continue
      }
      if (inputParams.has(apiName)) {
        throw new CatalogError(
          `${displayName} cannot be combined with ${apiName}.`,
          'VALIDATION',
        )
      }
      const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim())
      if (!match) {
        throw new CatalogError(
          `${displayName} must be a valid BRL amount.`,
          'VALIDATION',
        )
      }
      const whole = Number(match[1])
      const fraction = Number((match[2] ?? '').padEnd(2, '0'))
      const cents = whole * 100 + fraction
      if (!Number.isSafeInteger(cents)) {
        throw new CatalogError(
          `${displayName} is outside the allowed range.`,
          'VALIDATION',
        )
      }
      inputParams.delete(displayName)
      inputParams.set(apiName, String(cents))
    }
  }

  for (const [name, value] of inputParams) {
    if (!supportedParameters.has(name)) {
      throw new CatalogError(`Unsupported parameter: ${name}.`, 'VALIDATION')
    }
    if (inputParams.getAll(name).length !== 1 || value.includes('\u0000')) {
      throw new CatalogError(`Invalid ${name} parameter.`, 'VALIDATION')
    }
  }

  return Object.fromEntries(inputParams) as CatalogSearchInput
}
