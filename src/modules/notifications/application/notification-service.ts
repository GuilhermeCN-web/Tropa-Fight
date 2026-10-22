export type NotificationType =
  'ACCOUNT_CREATED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_CHANGED'

export type NotificationRequest = {
  id: string
  deduplicationKey: string
  recipient: string
  type: NotificationType
  template: string
  payload: Record<string, string>
  metadata?: Record<string, string>
}

export interface NotificationPort {
  send(notification: NotificationRequest): Promise<void>
}

const sensitiveNotificationField =
  /(password|passwd|token|secret|authorization|cookie|card(number)?|cvv|credential|private.?key)/i

export class InvalidNotificationPayloadError extends Error {
  constructor() {
    super('Notification payload contains a prohibited field.')
    this.name = 'InvalidNotificationPayloadError'
  }
}

export class NotificationService {
  private readonly port: NotificationPort

  constructor(port: NotificationPort) {
    this.port = port
  }

  async send(notification: NotificationRequest): Promise<void> {
    const fields = [
      ...Object.keys(notification.payload),
      ...Object.keys(notification.metadata ?? {}),
    ]
    if (fields.some((field) => sensitiveNotificationField.test(field))) {
      throw new InvalidNotificationPayloadError()
    }
    await this.port.send(notification)
  }
}
