import 'server-only'
import { createLogger } from '../../../infrastructure/logger'
import { NotificationService } from '../application/notification-service'
import { OrderNotifier } from '../application/order-notifications'
import { MockNotificationAdapter } from './mock-notification-adapter'
import { PostgresOrderRecipientResolver } from './postgres-order-recipient-resolver'

declare global {
  var localNotificationAdapter: MockNotificationAdapter | undefined
  var localOrderNotifier: OrderNotifier | undefined
}

/**
 * Process-wide mock adapter (ADR-014: no real provider). Shared by every
 * caller so deduplication holds across checkout and payment events.
 */
export function getLocalNotificationAdapter(): MockNotificationAdapter {
  globalThis.localNotificationAdapter ??= new MockNotificationAdapter()
  return globalThis.localNotificationAdapter
}

/** Order notifier wired to the local mock adapter and PostgreSQL. */
export function getLocalOrderNotifier(): OrderNotifier {
  globalThis.localOrderNotifier ??= new OrderNotifier(
    new NotificationService(getLocalNotificationAdapter()),
    new PostgresOrderRecipientResolver(),
    createLogger('warn'),
  )
  return globalThis.localOrderNotifier
}
