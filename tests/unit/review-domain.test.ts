import { describe, expect, it } from 'vitest'
import {
  normalizeReviewInput,
  normalizeReviewPatch,
  parseReviewPage,
  ReviewError,
} from '../../src/modules/reviews/domain/review'

describe('review domain', () => {
  it('accepts ratings 1 through 5 and normalizes an optional comment', () => {
    expect(normalizeReviewInput({ rating: 5 })).toEqual({
      rating: 5,
      comment: null,
    })
    expect(
      normalizeReviewInput({ rating: 1, comment: '  Good fit  ' }),
    ).toEqual({
      rating: 1,
      comment: 'Good fit',
    })
    expect(normalizeReviewInput({ rating: 3, comment: '   ' })).toEqual({
      rating: 3,
      comment: null,
    })
    expect(
      normalizeReviewInput({ rating: 5, comment: '😀'.repeat(2000) }).comment,
    ).toHaveLength(4000)
  })

  it('rejects invalid ratings and comments over 2000 characters', () => {
    for (const rating of [0, 6, 1.5, '5']) {
      expect(() => normalizeReviewInput({ rating })).toThrow(ReviewError)
    }
    expect(() =>
      normalizeReviewInput({ rating: 5, comment: 'x'.repeat(2001) }),
    ).toThrow('Comment must not exceed 2000 characters.')
    expect(() =>
      normalizeReviewInput({ rating: 5, comment: '😀'.repeat(2001) }),
    ).toThrow('Comment must not exceed 2000 characters.')
  })

  it('validates review updates and pagination', () => {
    expect(normalizeReviewPatch({ comment: null })).toEqual({ comment: null })
    expect(() => normalizeReviewPatch({})).toThrow(ReviewError)
    expect(() =>
      normalizeReviewPatch({ rating: 4, customerId: 'spoofed' }),
    ).toThrow(ReviewError)
    expect(parseReviewPage(new URLSearchParams('page=2&pageSize=10'))).toEqual({
      page: 2,
      pageSize: 10,
    })
    expect(() => parseReviewPage(new URLSearchParams('page=0'))).toThrow(
      ReviewError,
    )
  })
})
