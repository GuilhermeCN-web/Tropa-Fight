import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { appConfig } from './infrastructure/config'
import { createLogger } from './infrastructure/logger'
import { App } from './presentation/App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The application root element was not found.')
}

const logger = createLogger(appConfig.logLevel)
logger.info(`Application started in ${appConfig.environment} mode.`)

window.addEventListener('beforeunload', () => {
  logger.info('Application stopped.')
})

window.addEventListener('error', () => {
  logger.error('Unexpected application error.')
})

window.addEventListener('unhandledrejection', () => {
  logger.error('Unexpected asynchronous application error.')
})

createRoot(rootElement).render(
  <StrictMode>
    <App environment={appConfig.environment} />
  </StrictMode>,
)
