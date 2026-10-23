import type {
  CatalogBrand,
  CatalogCategory,
  CatalogEntityStatus,
  CatalogProduct,
} from '../domain/catalog'

export type EntityInput = { name: string }
export type EntityUpdate = { name?: string; status?: CatalogEntityStatus }
export type ProductInput = {
  name: string
  description: string | null
  brandId: string
  categoryIds: string[]
}
export type ProductUpdate = Partial<ProductInput>

export interface CatalogRepository {
  createCategory(input: EntityInput, actorId: string): Promise<CatalogCategory>
  updateCategory(
    id: string,
    input: EntityUpdate,
    actorId: string,
  ): Promise<CatalogCategory>
  getCategory(id: string): Promise<CatalogCategory | null>
  listCategories(): Promise<CatalogCategory[]>
  createBrand(input: EntityInput, actorId: string): Promise<CatalogBrand>
  updateBrand(
    id: string,
    input: EntityUpdate,
    actorId: string,
  ): Promise<CatalogBrand>
  getBrand(id: string): Promise<CatalogBrand | null>
  listBrands(): Promise<CatalogBrand[]>
  createProduct(input: ProductInput, actorId: string): Promise<CatalogProduct>
  updateProduct(
    id: string,
    input: ProductUpdate,
    actorId: string,
  ): Promise<CatalogProduct>
  publishProduct(id: string, actorId: string): Promise<CatalogProduct>
  archiveProduct(id: string, actorId: string): Promise<CatalogProduct>
  getProduct(id: string): Promise<CatalogProduct | null>
  listProducts(): Promise<CatalogProduct[]>
  getPublicProduct(id: string): Promise<CatalogProduct | null>
  listPublicProducts(): Promise<CatalogProduct[]>
}
