import { notFound } from 'next/navigation'
import { CatalogError } from '../../../src/modules/catalog/domain/catalog'
import { ProductDetail } from '../../../src/modules/catalog/presentation/product-detail'
import {
  catalogService,
  productVariantService,
} from '../../../src/modules/catalog/presentation/http'

type ProductPageProps = {
  params: Promise<{ id: string }>
}

async function loadProduct(id: string) {
  try {
    const product = await catalogService.getPublicProduct(id)
    if (!product) return null
    return {
      product,
      variants: await productVariantService.listPublicByProduct(id),
    }
  } catch (error) {
    if (error instanceof CatalogError && error.code === 'VALIDATION')
      return null
    throw error
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const result = await loadProduct(id)
  if (!result) notFound()
  return <ProductDetail product={result.product} variants={result.variants} />
}
