export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const allowedLogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error']
const allowedEnvironments = ['development', 'test', 'production'] as const

function parseEnvironment(
  value: string | undefined,
): (typeof allowedEnvironments)[number] {
  const environment = value || process.env.NODE_ENV || 'development'

  if (
    allowedEnvironments.includes(
      environment as (typeof allowedEnvironments)[number],
    )
  ) {
    return environment as (typeof allowedEnvironments)[number]
  }

  throw new Error('NODE_ENV must be development, test, or production.')
}

function parseLogLevel(value: string | undefined): LogLevel {
  const logLevel = value || 'info'

  if (allowedLogLevels.includes(logLevel as LogLevel)) {
    return logLevel as LogLevel
  }

  throw new Error('LOG_LEVEL must be debug, info, warn, or error.')
}

export const appConfig = {
  environment: parseEnvironment(process.env.NODE_ENV),
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
} as const
