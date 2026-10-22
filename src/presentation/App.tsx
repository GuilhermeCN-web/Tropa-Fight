import { getApplicationHealth } from '../application/get-application-health'
import './app.css'

type AppProps = {
  environment: string
}

export function App({ environment }: AppProps) {
  const health = getApplicationHealth()

  return (
    <main className="app-shell">
      <section className="status-card" aria-labelledby="app-title">
        <p className="eyebrow">Fundação da aplicação</p>
        <h1 id="app-title">Tropa Fight</h1>
        <p className="description">
          Interface inicial pronta para desenvolvimento.
        </p>
        <p className="health" role="status">
          Estado: {health.status}
        </p>
        <p className="environment">Ambiente: {environment}</p>
      </section>
    </main>
  )
}
