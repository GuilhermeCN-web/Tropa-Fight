import { describe, expect, it } from 'vitest'
import { getApplicationHealth } from '../../src/application/get-application-health'

describe('getApplicationHealth', () => {
  it('returns a healthy status for the initial application shell', () => {
    expect(getApplicationHealth()).toEqual({ status: 'ok' })
  })
})
