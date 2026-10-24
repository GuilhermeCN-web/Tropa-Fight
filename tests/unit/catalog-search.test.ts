import { describe, expect, it } from 'vitest'
import { CatalogError } from '../../src/modules/catalog/domain/catalog'
import { normalizeCatalogSearch } from '../../src/modules/catalog/domain/catalog-search'
import { readCatalogSearchParams } from '../../src/modules/catalog/presentation/catalog-search-params'

const categoryId = '3d1b5b8a-5b8d-4d25-8dd7-1dd6bcd5d3c1'
const brandId = '4d1b5b8a-5b8d-4d25-8dd7-1dd6bcd5d3c2'

describe('catalog search contract', () => {
  it('normalizes whitespace and applies approved defaults', () => {
    expect(
      normalizeCatalogSearch({ q: '  MMA   gloves ', page: '', pageSize: '' }),
    ).toEqual({ q: 'MMA gloves', sort: 'name_asc', page: 1, pageSize: 20 })
  })

  it('validates and returns combined approved filters', () => {
    expect(
      normalizeCatalogSearch({
        categoryId,
        brandId,
        minPriceCents: '0',
        maxPriceCents: '10000',
        sort: 'price_asc',
        page: '2',
        pageSize: '50',
      }),
    ).toEqual({
      categoryId,
      brandId,
      minPriceCents: 0,
      maxPriceCents: 10000,
      sort: 'price_asc',
      page: 2,
      pageSize: 50,
    })
  })

  it.each([
    [{ minPriceCents: '-1' }],
    [{ minPriceCents: '10.5' }],
    [{ minPriceCents: '200', maxPriceCents: '100' }],
    [{ categoryId: 'invalid' }],
    [{ sort: 'created_at' }],
    [{ page: '0' }],
    [{ pageSize: '101' }],
    [{ page: '9007199254740991', pageSize: '100' }],
  ])('rejects invalid values: %o', (input) => {
    expect(() => normalizeCatalogSearch(input)).toThrow(CatalogError)
  })

  it('rejects unknown and repeated query parameters', () => {
    expect(() =>
      readCatalogSearchParams(new URLSearchParams('sort=name_asc&x=1')),
    ).toThrow(CatalogError)
    expect(() =>
      readCatalogSearchParams(new URLSearchParams('page=1&page=2')),
    ).toThrow(CatalogError)
  })

  it('converts catalog page prices from BRL to API centavos', () => {
    expect(
      readCatalogSearchParams(
        new URLSearchParams('minPrice=12%2C34&maxPrice=100.00'),
        { displayPricesInReais: true },
      ),
    ).toEqual({ minPriceCents: '1234', maxPriceCents: '10000' })
    expect(() =>
      readCatalogSearchParams(new URLSearchParams('minPrice=1.234'), {
        displayPricesInReais: true,
      }),
    ).toThrow(CatalogError)
  })
})
