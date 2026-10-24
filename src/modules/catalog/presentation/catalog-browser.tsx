import type { CatalogBrand, CatalogCategory } from '../domain/catalog'
import type {
  CatalogSearchInput,
  CatalogSearchResult,
} from '../domain/catalog-search'

type CatalogBrowserProps = {
  query: CatalogSearchInput
  result: CatalogSearchResult | null
  categories: CatalogCategory[]
  brands: CatalogBrand[]
  error?: string
}

function pageHref(query: CatalogSearchInput, page: number): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  for (const [key, value] of Object.entries(query)) {
    if (key !== 'page' && value) params.set(key, value)
  }
  return `/catalog?${params.toString()}`
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100)
}

export function CatalogBrowser({
  query,
  result,
  categories,
  brands,
  error,
}: CatalogBrowserProps) {
  const currentPage = result?.pagination.page ?? Number(query.page ?? 1)
  const pagination = result?.pagination

  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <a href="/" className="catalog-home-link">
          Tropa Fight
        </a>
        <h1>Catálogo</h1>
        <p>Encontre produtos de luta e treinamento.</p>
      </header>

      <form action="/catalog" method="get" className="catalog-filters">
        <label>
          Buscar produtos
          <input
            type="search"
            name="q"
            defaultValue={query.q}
            placeholder="Nome, descrição, marca ou categoria"
            aria-describedby={error ? 'catalog-error' : undefined}
          />
        </label>
        <label>
          Categoria
          <select
            name="categoryId"
            defaultValue={query.categoryId ?? ''}
            aria-describedby={error ? 'catalog-error' : undefined}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Marca
          <select
            name="brandId"
            defaultValue={query.brandId ?? ''}
            aria-describedby={error ? 'catalog-error' : undefined}
          >
            <option value="">Todas as marcas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preço mínimo (R$)
          <input
            type="number"
            name="minPrice"
            min="0"
            step="0.01"
            defaultValue={
              query.minPriceCents === undefined
                ? undefined
                : (Number(query.minPriceCents) / 100).toFixed(2)
            }
            aria-describedby={error ? 'catalog-error' : undefined}
          />
        </label>
        <label>
          Preço máximo (R$)
          <input
            type="number"
            name="maxPrice"
            min="0"
            step="0.01"
            defaultValue={
              query.maxPriceCents === undefined
                ? undefined
                : (Number(query.maxPriceCents) / 100).toFixed(2)
            }
            aria-describedby={error ? 'catalog-error' : undefined}
          />
        </label>
        <label>
          Ordenar por
          <select
            name="sort"
            defaultValue={query.sort ?? 'name_asc'}
            aria-describedby={error ? 'catalog-error' : undefined}
          >
            <option value="name_asc">Nome: A–Z</option>
            <option value="name_desc">Nome: Z–A</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </label>
        <input type="hidden" name="page" value="1" />
        <div className="catalog-filter-actions">
          <button type="submit">Aplicar filtros</button>
          <a href="/catalog">Limpar filtros</a>
        </div>
      </form>

      {error ? (
        <p className="catalog-message" id="catalog-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <>
          <p className="catalog-results-count" role="status" aria-live="polite">
            {pagination?.totalItems === 1
              ? '1 produto encontrado'
              : `${pagination?.totalItems ?? 0} produtos encontrados`}
          </p>
          {result.items.length > 0 ? (
            <ul className="catalog-product-grid" aria-label="Produtos">
              {result.items.map((product) => (
                <li key={product.id} className="catalog-product-card">
                  <h2>{product.name}</h2>
                  <p>{product.brand.name}</p>
                  {product.categories.length > 0 ? (
                    <p>
                      {product.categories.map((item) => item.name).join(', ')}
                    </p>
                  ) : null}
                  {product.description ? <p>{product.description}</p> : null}
                  <p className="catalog-product-price">
                    {formatPrice(product.priceCents)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="catalog-empty-state">Nenhum produto encontrado.</p>
          )}

          {pagination && pagination.totalPages > 1 ? (
            <nav
              className="catalog-pagination"
              aria-label="Paginação do catálogo"
            >
              {currentPage > 1 ? (
                <a href={pageHref(query, currentPage - 1)} rel="prev">
                  Página anterior
                </a>
              ) : (
                <span aria-disabled="true">Página anterior</span>
              )}
              <span aria-current="page">
                Página {currentPage} de {pagination.totalPages}
              </span>
              {currentPage < pagination.totalPages ? (
                <a href={pageHref(query, currentPage + 1)} rel="next">
                  Próxima página
                </a>
              ) : (
                <span aria-disabled="true">Próxima página</span>
              )}
            </nav>
          ) : null}
        </>
      ) : null}
    </main>
  )
}
