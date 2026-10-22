import type { ApplicationHealth } from '../domain/application-health'

export function getApplicationHealth(): ApplicationHealth {
  return { status: 'ok' }
}
