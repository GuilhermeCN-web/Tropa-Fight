import 'server-only'
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'

const cost = 16_384
const blockSize = 8
const parallelization = 1
const keyLength = 64
const maxMemory = 64 * 1024 * 1024

function deriveKey(
  password: string,
  salt: Buffer,
  length: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, key) => {
      if (error) reject(error)
      else resolve(key as Buffer)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await deriveKey(password, salt, keyLength, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: maxMemory,
  })

  return [
    'scrypt',
    cost,
    blockSize,
    parallelization,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$')
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, n, r, p, saltHex, hashHex] = encoded.split('$')
  if (algorithm !== 'scrypt' || !n || !r || !p || !saltHex || !hashHex) {
    return false
  }

  const expected = Buffer.from(hashHex, 'hex')
  if (expected.length !== keyLength) return false

  try {
    const derived = await deriveKey(
      password,
      Buffer.from(saltHex, 'hex'),
      expected.length,
      {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: maxMemory,
      },
    )
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
