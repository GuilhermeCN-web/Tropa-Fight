import { describe, expect, it } from 'vitest'
import {
  hashPassword,
  verifyPassword,
} from '../../src/modules/identity/infrastructure/password-hasher'

describe('identity password hasher', () => {
  it('stores a salted scrypt hash and verifies only the matching password', async () => {
    const password = 'ValidPass1!'
    const hash = await hashPassword(password)

    expect(hash).not.toContain(password)
    expect(hash.split('$')).toHaveLength(6)
    expect(await verifyPassword(password, hash)).toBe(true)
    expect(await verifyPassword('WrongPass1!', hash)).toBe(false)
  })

  it('rejects malformed hashes', async () => {
    expect(await verifyPassword('ValidPass1!', 'invalid')).toBe(false)
  })
})
