import type {
  NotificationRequest,
  NotificationService,
} from './notification-service'

/** Resolves the customer account that owns an order (no personal data). */
export interface OrderRecipientResolver {
  customerIdForOrder(orderId: string): Promise<string | null>
}

export type OrderNotificationLogger = { warn(message: string): void }

export type OrderCreatedEvent = { orderId: string; totalCents: number }
export type PaymentApprovedEvent = {
  paymentId: string
  orderId: string
  amountCents: number
}

/**
 * Order notifications (RF-028, UC-023, TASK-020).
 *
 * Callers invoke these methods only **after** the order or payment
 * transaction has committed. Delivery is best-effort: a failure is logged
 * without personal data and never propagates, so it cannot revert or alter
 * the order or the payment. Each event has a stable deduplication key, so a
 * replay (Idempotency-Key, duplicate webhook) yields at most one notification.
 *
 * The recipient is the customer account id; contact details are resolved by
 * the delivery adapter, so no e-mail or other personal data travels in the
 * notification request.
 */
export class OrderNotifier {
  private readonly notifications: NotificationService
  private readonly recipients: OrderRecipientResolver
  private readonly logger: OrderNotificationLogger

  constructor(
    notifications: NotificationService,
    recipients: OrderRecipientResolver,
    logger: OrderNotificationLogger,
  ) {
    this.notifications = notifications
    this.recipients = recipients
    this.logger = logger
  }

  orderCreated(event: OrderCreatedEvent): Promise<void> {
    return this.deliver(event.orderId, (recipient) => ({
      id: `order-created:${event.orderId}`,
      deduplicationKey: `order-created:${event.orderId}`,
      recipient,
      type: 'ORDER_CREATED',
      template: 'order-created',
      payload: {
        orderId: event.orderId,
        totalCents: String(event.totalCents),
      },
    }))
  }

  paymentApproved(event: PaymentApprovedEvent): Promise<void> {
    return this.deliver(event.orderId, (recipient) => ({
      id: `payment-approved:${event.paymentId}`,
      deduplicationKey: `payment-approved:${event.paymentId}`,
      recipient,
      type: 'PAYMENT_APPROVED',
      template: 'payment-approved',
      payload: {
        orderId: event.orderId,
        paymentId: event.paymentId,
        amountCents: String(event.amountCents),
      },
    }))
  }

  private async deliver(
    orderId: string,
    build: (recipient: string) => NotificationRequest,
  ): Promise<void> {
    let notification: NotificationRequest | undefined
    try {
      const customerId = await this.recipients.customerIdForOrder(orderId)
      if (!customerId) {
        this.logger.warn(
          `Order notification skipped: order ${orderId} has no recipient.`,
        )
        return
      }
      notification = build(`customer:${customerId}`)
      await this.notifications.send(notification)
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError'
      this.logger.warn(
        `Order notification failed (${notification?.type ?? 'UNRESOLVED'}, order ${orderId}): ${reason}.`,
      )
    }
  }
}
