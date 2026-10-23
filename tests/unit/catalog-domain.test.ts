import { describe, expect, it } from 'vitest'
import {
  CatalogError,
  normalizeDescription,
  normalizeName,
  requireCategoryIds,
  requireUuid,
} from '../../src/modules/catalog/domain/catalog'

const validId = '3d1b5b8a-5b8d-4d25-8dd7-1dd6bcd5d3c1'

describe('catalog domain validation', () => {
  it('trims names and applies product and entity length limits', () => {
    expect(normalizeName('  Gloves  ', 100)).toBe('Gloves')
    expect(normalizeName('x'.repeat(100), 100)).toHaveLength(100)
    expect(() => normalizeName('x'.repeat(101), 100)).toThrow(CatalogError)
    expect(normalizeName('x'.repeat(50), 50)).toHaveLength(50)
    expect(() => normalizeName('x'.repeat(51), 50)).toThrow(CatalogError)
    expect(() => normalizeName('   ', 100)).toThrow(CatalogError)
  })

  it('normalizes optional plain text descriptions up to 1000 characters', () => {
    expect(normalizeDescription(undefined)).toBeNull()
    expect(normalizeDescription('  details  ')).toBe('details')
    expect(normalizeDescription('x'.repeat(1000))).toHaveLength(1000)
    expect(() => normalizeDescription('x'.repeat(1001))).toThrow(CatalogError)
  })

  it('requires stable UUIDs and at least one distinct category', () => {
    expect(requireUuid(validId)).toBe(validId)
    expect(() => requireUuid('not-a-uuid')).toThrow(CatalogError)
    expect(requireCategoryIds([validId])).toEqual([validId])
    expect(() => requireCategoryIds([])).toThrow(CatalogError)
    expect(() => requireCategoryIds([validId, validId])).toThrow(CatalogError)
  })
})
