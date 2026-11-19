import {
  AdminAccountError,
  normalizeAdminAccountChange,
  normalizeNewAdminAccount,
  type AdminAccount,
  type AdminAccountChange,
  type AdminRole,
} from '../domain/admin-account'

export interface AdminAccountRepository {
  list(): Promise<AdminAccount[]>
  /** Persists the account, its single role and the audit event atomically. */
  create(
    actorId: string,
    account: { email: string; passwordHash: string; role: AdminRole },
  ): Promise<AdminAccount>
  /**
   * Applies the change atomically: enforces RN-022 under a lock, revokes
   * sessions on deactivation and audits every effective change.
   */
  update(
    actorId: string,
    userId: string,
    change: AdminAccountChange,
  ): Promise<AdminAccount | null>
}

export type PasswordHasher = (password: string) => Promise<string>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Administrative account management (RF-038, UC-018/UC-019). */
export class AdminAccountService {
  private readonly repository: AdminAccountRepository
  private readonly hashPassword: PasswordHasher

  constructor(
    repository: AdminAccountRepository,
    hashPassword: PasswordHasher,
  ) {
    this.repository = repository
    this.hashPassword = hashPassword
  }

  list() {
    return this.repository.list()
  }

  async create(actorId: string, input: unknown) {
    const account = normalizeNewAdminAccount(input)
    return this.repository.create(actorId, {
      email: account.email,
      passwordHash: await this.hashPassword(account.password),
      role: account.role,
    })
  }

  update(actorId: string, userId: string, input: unknown) {
    if (!uuidPattern.test(userId))
      throw new AdminAccountError('Account not found.', 'NOT_FOUND')
    return this.repository.update(
      actorId,
      userId,
      normalizeAdminAccountChange(input),
    )
  }
}
