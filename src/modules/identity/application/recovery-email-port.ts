export interface RecoveryEmailPort {
  sendRecoveryLink(email: string, token: string): Promise<void>
}

export class UnconfiguredRecoveryEmail implements RecoveryEmailPort {
  async sendRecoveryLink(): Promise<void> {
    throw new Error('No recovery email provider is configured.')
  }
}
