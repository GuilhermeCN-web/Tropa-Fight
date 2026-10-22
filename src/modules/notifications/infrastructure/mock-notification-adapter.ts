import type {
  NotificationPort,
  NotificationRequest,
} from '../application/notification-service'

/** In-memory adapter for tests and local wiring; it never contacts a provider. */
export class MockNotificationAdapter implements NotificationPort {
  readonly sent: NotificationRequest[] = []
  private readonly processedKeys = new Set<string>()

  async send(notification: NotificationRequest): Promise<void> {
    if (this.processedKeys.has(notification.deduplicationKey)) return
    this.processedKeys.add(notification.deduplicationKey)
    this.sent.push(notification)
  }
}
