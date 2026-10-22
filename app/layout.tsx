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
      <body>{children}</body>
    </html>
  )
}
