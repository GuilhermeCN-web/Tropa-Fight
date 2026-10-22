import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { randomUUID } from 'node:crypto'
import { getDatabasePool } from '../src/infrastructure/database/pool.ts'
import { validatePassword, normalizeEmail, isValidEmail } from '../src/modules/identity/domain/password-policy.ts'
import { hashPassword } from '../src/modules/identity/infrastructure/password-hasher.ts'

async function readSecret(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal.')
  }

  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()
  stdin.setEncoding('utf8')

  return await new Promise((resolve, reject) => {
    let value = ''
    const cleanup = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      stdout.write('\n')
    }
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup()
          reject(new Error('Cancelled.'))
          return
        }
        if (character === '\r' || character === '\n') {
          cleanup()
          resolve(value)
          return
        }
        if (character === '\u007f' || character === '\b') {
          value = [...value].slice(0, -1).join('')
          continue
        }
        value += character
      }
    }

    stdin.on('data', onData)
  })
}

const emailPrompt = createInterface({ input: stdin, output: stdout })
const email = normalizeEmail(await emailPrompt.question('Administrator email: '))
emailPrompt.close()
if (!isValidEmail(email)) throw new Error('Enter a valid email address.')

const password = await readSecret('Password (hidden): ')
const passwordErrors = validatePassword(password)
if (passwordErrors.length > 0) throw new Error(passwordErrors.join(' '))

const pool = getDatabasePool()
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query("SELECT pg_advisory_xact_lock(703003001)")
  const existing = await client.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM identity_users WHERE account_type = 'ADMIN') AS exists",
  )
  if (existing.rows[0]?.exists) {
    throw new Error('An administrator already exists; bootstrap can only run once.')
  }

  const userId = randomUUID()
  const passwordHash = await hashPassword(password)
  await client.query(
    `INSERT INTO identity_users (id, email, password_hash, account_type, status)
     VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE')`,
    [userId, email, passwordHash],
  )
  await client.query(
    "INSERT INTO identity_user_roles (user_id, role_code) VALUES ($1, 'GENERAL_ADMIN')",
    [userId],
  )
  await client.query('COMMIT')
  stdout.write('Initial Administrator General created.\n')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
