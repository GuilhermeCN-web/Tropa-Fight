import { describe, expect, it } from 'vitest'
import {
  ReviewError,
  assertModeratable,
  normalizeModerationDecision,
  parseAdminReviewQuery,
} from '../../src/modules/reviews/domain/review'

describe('review moderation domain (TASK-019, RF-037, RN-015)', () => {
  it('defaults the moderation queue to PENDING with pagination', () => {
    expect(parseAdminReviewQuery(new URLSearchParams())).toEqual({
      page: { page: 1, pageSize: 20 },
      status: 'PENDING',
    })
    expect(
      parseAdminReviewQuery(new URLSearchParams('status=REJECTED&pageSize=5')),
    ).toEqual({ page: { page: 1, pageSize: 5 }, status: 'REJECTED' })
  })

  it.each([
    'status=ARCHIVED',
    'status=pending',
    'sort=rating',
    'page=0',
    'status=PENDING&status=REJECTED',
  ])('rejects invalid moderation queries: %s', (query) => {
    expect(() => parseAdminReviewQuery(new URLSearchParams(query))).toThrow(
      ReviewError,
    )
  })

  it('accepts only PUBLISHED or REJECTED, without other fields', () => {
    expect(normalizeModerationDecision({ status: 'PUBLISHED' })).toBe(
      'PUBLISHED',
    )
    expect(normalizeModerationDecision({ status: 'REJECTED' })).toBe('REJECTED')
    for (const input of [
      { status: 'PENDING' },
      { status: 'PUBLISHED', comment: 'edit' },
      { status: 'REJECTED', reason: 'spam' },
      {},
      null,
      ['PUBLISHED'],
    ])
      expect(() => normalizeModerationDecision(input)).toThrow(ReviewError)
  })

  it('allows moderation only from PENDING', () => {
    expect(() => assertModeratable('PENDING')).not.toThrow()
    for (const status of ['PUBLISHED', 'REJECTED'] as const)
      expect(() => assertModeratable(status)).toThrow(
        expect.objectContaining({ code: 'CONFLICT' }),
      )
  })
})
