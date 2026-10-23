import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CatalogBrowser } from '../../src/modules/catalog/presentation/catalog-browser'

describe('catalog browser accessibility', () => {
  it('renders labeled search and filter controls with keyboard-operable pagination', () => {
    const html = renderToStaticMarkup(
      <CatalogBrowser
        query={{ page: '1', pageSize: '1' }}
        categories={[]}
        brands={[]}
        result={{
          items: [],
          pagination: {
            page: 1,
            pageSize: 1,
            totalItems: 2,
            totalPages: 2,
          },
        }}
      />,
    )

    expect(html).toContain('<label>Buscar produtos')
    expect(html).toContain('<label>Categoria')
    expect(html).toContain('<label>Marca')
    expect(html).toContain('aria-label="Paginação do catálogo"')
    expect(html).toContain('href="/catalog?page=2&pageSize=1"')
    expect(html).toContain('Nenhum produto encontrado.')
  })
})
