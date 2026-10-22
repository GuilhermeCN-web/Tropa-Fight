import { describe, expect, it, vi } from 'vitest'
import { sanitizeLogMessage } from '../../src/modules/privacy/domain/sensitive-data'
import { createLogger } from '../../src/infrastructure/logger'

describe('sensitive data logging', () => {
  it('redacts common secret fields in log messages', () => {
    expect(
      sanitizeLogMessage(
        'password=abc token:xyz authorization=Bearer abc123 cookie=session passwordHash=hash refreshToken=refresh DATABASE_URL=postgresql://db',
      ),
    ).toBe(
      'password=[REDACTED] token:[REDACTED] authorization=[REDACTED] cookie=[REDACTED] passwordHash=[REDACTED] refreshToken=[REDACTED] DATABASE_URL=[REDACTED]',
    )
  })

  it('sanitizes before writing to the configured logger', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    createLogger('warn').warn('reset token=must-not-appear')
    expect(warn).toHaveBeenCalledWith('[Tropa Fight] reset token=[REDACTED]')
    warn.mockRestore()
  })
})
