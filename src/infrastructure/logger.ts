import type { LogLevel } from './config'
import { sanitizeLogMessage } from '../modules/privacy/domain/sensitive-data'

const priorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const methods: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

export function createLogger(minimumLevel: LogLevel) {
  function write(level: LogLevel, message: string): void {
    if (priorities[level] < priorities[minimumLevel]) return

    console[methods[level]](`[Tropa Fight] ${sanitizeLogMessage(message)}`)
  }

  return {
    debug: (message: string) => write('debug', message),
    info: (message: string) => write('info', message),
    warn: (message: string) => write('warn', message),
    error: (message: string) => write('error', message),
  }
}
