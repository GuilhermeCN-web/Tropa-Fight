import 'server-only'
import {
  normalizeEmail,
  isValidEmail,
  validatePassword,
} from '../domain/password-policy'
import { toPublicProfile } from '../domain/identity-user'
import * as repository from '../infrastructure/identity-repository'
import { hashPassword, verifyPassword } from '../infrastructure/password-hasher'
import type { RecoveryEmailPort } from './recovery-email-port'
import { createLogger } from '../../../infrastructure/logger'
import { randomUUID } from 'node:crypto'
import { createAuditEvent } from '../../audit/domain/audit-event'
import { recordAuditEvent } from '../../audit/application/audit-service'

const logger = createLogger('warn')

export class IdentityInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IdentityInputError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email or password is incorrect.')
    this.name = 'InvalidCredentialsError'
  }
}

export async function registerCustomer(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput)
  if (!isValidEmail(email))
    throw new IdentityInputError('Enter a valid email address.')
  const passwordErrors = validatePassword(password)
  if (passwordErrors.length > 0)
    throw new IdentityInputError(passwordErrors.join(' '))

  const passwordHash = await hashPassword(password)
  const userId = randomUUID()
  try {
    return await repository.createCustomer(email, passwordHash, userId)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new IdentityInputError('An account with this email already exists.')
    }
    throw error
  }
}

export async function authenticate(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput)
  const credential = await repository.findCredentialByEmail(email)
  const matches = credential
    ? await verifyPassword(password, credential.passwordHash)
    : false

  if (!credential || credential.status !== 'ACTIVE' || !matches) {
    await recordAuditEvent(
      createAuditEvent({
        actorId: null,
        action: 'AUTH_LOGIN_FAILED',
        result: 'FAILURE',
        source: 'identity.login',
      }),
    )
    throw new InvalidCredentialsError()
  }
  return repository.createSession(credential.id)
}

export async function getPublicProfile(userId: string) {
  const principal = await repository.findPrincipalById(userId)
  return principal ? toPublicProfile(principal) : null
}

export async function requestPasswordRecovery(
  emailInput: string,
  delivery: RecoveryEmailPort,
): Promise<void> {
  const email = normalizeEmail(emailInput)
  if (!isValidEmail(email)) return

  await recordAuditEvent({
    actorId: null,
    action: 'AUTH_PASSWORD_RESET_REQUESTED',
    resourceType: 'IdentityUser',
    result: 'SUCCESS',
    source: 'identity.password-recovery',
  })

  const userId = await repository.findUserIdByEmail(email)
  if (!userId) return

  const token = await repository.createPasswordResetToken(userId)
  try {
    await delivery.sendRecoveryLink(email, token)
  } catch {
    logger.warn('Password recovery delivery is unavailable.')
  }
}

export async function completePasswordRecovery(
  token: string,
  password: string,
): Promise<boolean> {
  if (!token) throw new IdentityInputError('Recovery token is required.')
  const passwordErrors = validatePassword(password)
  if (passwordErrors.length > 0)
    throw new IdentityInputError(passwordErrors.join(' '))
  return repository.resetPassword(token, await hashPassword(password))
}
