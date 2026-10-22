import { describe, expect, it } from 'vitest'
import {
  ApplicationError,
  ValidationError,
} from '../../src/application/errors/application-error'
import { InfrastructureError } from '../../src/infrastructure/errors/infrastructure-error'

describe('application error types', () => {
  it('distinguishes expected application, validation, and infrastructure errors', () => {
    expect(new ApplicationError('Expected failure').name).toBe(
      'ApplicationError',
    )
    expect(new ValidationError('Invalid input')).toBeInstanceOf(
      ApplicationError,
    )
    expect(new ValidationError('Invalid input').name).toBe('ValidationError')
    expect(new InfrastructureError('Technical failure')).toBeInstanceOf(
      ApplicationError,
    )
    expect(new InfrastructureError('Technical failure').name).toBe(
      'InfrastructureError',
    )
  })
})
