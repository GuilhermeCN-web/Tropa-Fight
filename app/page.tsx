import { App } from '../src/presentation/App'

export default function HomePage() {
  return <App environment={process.env.NODE_ENV ?? 'development'} />
}
