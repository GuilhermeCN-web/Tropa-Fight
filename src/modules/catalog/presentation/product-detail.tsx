import type { CatalogProduct } from '../domain/catalog'
import type { PublicProductVariant } from '../domain/product-variant'
import { AddToCartForm } from '../../cart/presentation/add-to-cart-form'
import { formatCents } from '../../checkout/presentation/storefront'

type ProductDetailProps = {
  product: CatalogProduct
  variants: PublicProductVariant[]
}

export function lowestPriceCents(
  variants: Pick<PublicProductVariant, 'priceCents'>[],
): number | null {
  return variants.length === 0
    ? null
    : Math.min(...variants.map((variant) => variant.priceCents))
}

export function ProductDetail({ product, variants }: ProductDetailProps) {
  const fromPrice = lowestPriceCents(variants)
  return (
    <main className="store-shell">
      <p>
        <a href="/catalog">← Voltar ao catálogo</a>
      </p>
      <article className="store-card" aria-labelledby="product-title">
        <p className="eyebrow">{product.brand.name}</p>
        <h1 id="product-title" className="store-title">
          {product.name}
        </h1>
        {product.categories.length > 0 ? (
          <p className="store-muted">
            {product.categories.map((category) => category.name).join(', ')}
          </p>
        ) : null}
        {product.description ? <p>{product.description}</p> : null}
        {fromPrice !== null ? (
          <p className="catalog-product-price">
            {variants.length > 1 ? 'A partir de ' : ''}
            {formatCents(fromPrice)}
          </p>
        ) : null}
        <AddToCartForm
          variants={variants.map((variant) => ({
            id: variant.id,
            attributes: variant.attributes,
            priceCents: variant.priceCents,
          }))}
        />
      </article>
    </main>
  )
}
