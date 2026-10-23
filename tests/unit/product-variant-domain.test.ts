import { describe, expect, it } from 'vitest'
import { CatalogError } from '../../src/modules/catalog/domain/catalog'
import {
  normalizePriceCents,
  normalizeSku,
  normalizeVariantAttributes,
  requireVariantStatus,
} from '../../src/modules/catalog/domain/product-variant'

describe('product variant domain', () => {
  it('keeps the entered SKU while rejecting blank values', () => {
    expect(normalizeSku('  TF-001  ')).toBe('  TF-001  ')
    expect(() => normalizeSku('  ')).toThrow(CatalogError)
  })

  it('allows only applicable size and color string attributes', () => {
    expect(
      normalizeVariantAttributes({ color: ' Black ', size: ' M ' }),
    ).toEqual({ size: 'M', color: 'Black' })
    expect(normalizeVariantAttributes({})).toEqual({})
    expect(() => normalizeVariantAttributes({ model: 'Pro' })).toThrow(
      CatalogError,
    )
    expect(() => normalizeVariantAttributes({ size: '' })).toThrow(CatalogError)
  })

  it('accepts only non-negative safe integer centavos and explicit statuses', () => {
    expect(normalizePriceCents(0)).toBe(0)
    expect(normalizePriceCents(10990)).toBe(10990)
    expect(() => normalizePriceCents(-1)).toThrow(CatalogError)
    expect(() => normalizePriceCents(1.5)).toThrow(CatalogError)
    expect(() => normalizePriceCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      CatalogError,
    )
    expect(requireVariantStatus('ACTIVE')).toBe('ACTIVE')
    expect(() => requireVariantStatus('AVAILABLE')).toThrow(CatalogError)
  })
})
