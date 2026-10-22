'use client'

import { useEffect, useState } from 'react'

type Profile = {
  email: string
  status: string
  accountType: string
  roles: string[]
  createdAt: string
}

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetch('/api/me')
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace('/login')
          return null
        }
        if (!response.ok) throw new Error('Não foi possível carregar o perfil.')
        return (await response.json()) as { user: Profile }
      })
      .then((result) => result && setProfile(result.user))
      .catch(() => setError('Não foi possível carregar o perfil.'))
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/')
  }

  return (
    <main className="auth-shell">
      <section className="status-card auth-card">
        <p className="eyebrow">Conta</p>
        <h1>Meu perfil</h1>
        {error && <p role="alert">{error}</p>}
        {profile && (
          <dl className="profile-data">
            <dt>E-mail</dt>
            <dd>{profile.email}</dd>
            <dt>Status</dt>
            <dd>{profile.status}</dd>
            <dt>Tipo</dt>
            <dd>{profile.accountType}</dd>
            <dt>Papéis</dt>
            <dd>{profile.roles.join(', ')}</dd>
          </dl>
        )}
        <button type="button" onClick={logout}>
          Sair
        </button>
        <p>
          <a href="/">Início</a>
        </p>
      </section>
    </main>
  )
}
