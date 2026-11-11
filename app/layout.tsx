import type { Metadata } from 'next'
import '../src/presentation/app.css'

export const metadata: Metadata = {
  title: 'Tropa Fight',
  description: 'Aplicação local Tropa Fight',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <nav aria-label="Navegação principal">
            <a href="/" className="site-brand">
              Tropa Fight
            </a>
            <a href="/catalog">Catálogo</a>
            <a href="/cart">Carrinho</a>
            <a href="/orders">Pedidos</a>
            <a href="/profile">Conta</a>
          </nav>
        </header>
        <div id="conteudo">{children}</div>
      </body>
    </html>
  )
}
