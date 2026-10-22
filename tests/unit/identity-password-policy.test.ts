import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from '../../src/modules/identity/domain/password-policy'

describe('identity password policy', () => {
  it('accepts passwords matching the approved length and composition', () => {
    expect(validatePassword('ValidPass1!')).toEqual([])
  })

  it('rejects passwords that miss each required composition class', () => {
    expect(validatePassword('alllowercase1!')).toContain(
      'A senha deve conter uma letra maiúscula.',
    )
    expect(validatePassword('ALLUPPERCASE1!')).toContain(
      'A senha deve conter uma letra minúscula.',
    )
    expect(validatePassword('ValidPassword!')).toContain(
      'A senha deve conter um número.',
    )
    expect(validatePassword('ValidPass123')).toContain(
      'A senha deve conter um caractere especial.',
    )
  })

  it('enforces the minimum and maximum lengths', () => {
    expect(validatePassword('Aa1!')).toContain(
      'A senha deve ter pelo menos 8 caracteres.',
    )
    expect(validatePassword(`Aa1!${'x'.repeat(125)}`)).toContain(
      'A senha deve ter no máximo 128 caracteres.',
    )
  })
})

describe('identity email policy', () => {
  it('normalizes email consistently and validates its shape', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com')
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('not-an-email')).toBe(false)
  })
})
