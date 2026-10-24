import { CatalogError } from '../../src/modules/catalog/domain/catalog'
import type { CatalogSearchInput } from '../../src/modules/catalog/domain/catalog-search'
import { CatalogBrowser } from '../../src/modules/catalog/presentation/catalog-browser'
import { readCatalogSearchParams } from '../../src/modules/catalog/presentation/catalog-search-params'
import { catalogService } from '../../src/modules/catalog/presentation/http'

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toURLSearchParams(
  values: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry)
    } else if (value !== undefined) {
      params.append(key, value)
    }
  }
  return params
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const rawParams = await searchParams
  let query: CatalogSearchInput = {}
  let result: Awaited<
    ReturnType<typeof catalogService.searchPublicProducts>
  > | null = null
  let categories = [] as Awaited<
    ReturnType<typeof catalogService.listCategories>
  >
  let brands = [] as Awaited<ReturnType<typeof catalogService.listBrands>>
  let error: string | undefined

  try {
    const [allCategories, allBrands] = await Promise.all([
      catalogService.listCategories(),
      catalogService.listBrands(),
    ])
    categories = allCategories.filter(
      (category) => category.status === 'ACTIVE',
    )
    brands = allBrands.filter((brand) => brand.status === 'ACTIVE')
  } catch {
    error = 'Não foi possível carregar as opções do catálogo agora.'
  }

  try {
    query = readCatalogSearchParams(toURLSearchParams(rawParams), {
      displayPricesInReais: true,
    })
    result = await catalogService.searchPublicProducts(query)
  } catch (caught) {
    error ??=
      caught instanceof CatalogError
        ? caught.message
        : 'Não foi possível carregar o catálogo agora.'
  }

  return (
    <CatalogBrowser
      query={query}
      result={result}
      categories={categories}
      brands={brands}
      error={error}
    />
  )
}
