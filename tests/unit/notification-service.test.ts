import { describe, expect, it, vi } from 'vitest'
import {
  InvalidNotificationPayloadError,
  NotificationService,
} from '../../src/modules/notifications/application/notification-service'
import { MockNotificationAdapter } from '../../src/modules/notifications/infrastructure/mock-notification-adapter'

describe('notification abstraction', () => {
  it('dispatches through a replaceable port and deduplicates mock delivery', async () => {
    const adapter = new MockNotificationAdapter()
    const send = vi.spyOn(adapter, 'send')
    const service = new NotificationService(adapter)
    const notification = {
      id: 'event-1',
      deduplicationKey: 'account-created:user-1',
      recipient: 'user@example.test',
      type: 'ACCOUNT_CREATED' as const,
      template: 'account-created',
      payload: { name: 'User' },
    }

    await service.send(notification)
    await service.send(notification)

    expect(send).toHaveBeenCalledTimes(2)
    expect(adapter.sent).toEqual([notification])
  })

  it('propagates adapter failures without coupling callers to a provider', async () => {
    const port = { send: vi.fn().mockRejectedValue(new Error('offline')) }
    const service = new NotificationService(port)
    await expect(
      service.send({
        id: 'event-2',
        deduplicationKey: 'password-changed:user-1',
        recipient: 'user@example.test',
        type: 'PASSWORD_CHANGED',
        template: 'password-changed',
        payload: {},
      }),
    ).rejects.toThrow('offline')
  })

  it('rejects secret fields before forwarding a notification payload', async () => {
    const adapter = new MockNotificationAdapter()
    const service = new NotificationService(adapter)

    await expect(
      service.send({
        id: 'event-secret',
        deduplicationKey: 'password-reset:user-1',
        recipient: 'user@example.test',
        type: 'PASSWORD_RESET_REQUESTED',
        template: 'password-reset',
        payload: { resetToken: 'sensitive' },
      }),
    ).rejects.toBeInstanceOf(InvalidNotificationPayloadError)
    expect(adapter.sent).toEqual([])
  })
})
