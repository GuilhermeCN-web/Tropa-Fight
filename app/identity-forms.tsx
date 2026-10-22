'use client'

import { useState, type FormEvent } from 'react'

type FormMode = 'register' | 'login' | 'forgot' | 'reset'

const settings: Record<
  FormMode,
  { title: string; endpoint: string; submit: string }
> = {
  register: {
    title: 'Criar conta',
    endpoint: '/api/auth/register',
    submit: 'Criar conta',
  },
  login: { title: 'Entrar', endpoint: '/api/auth/login', submit: 'Entrar' },
  forgot: {
    title: 'Recuperar acesso',
    endpoint: '/api/auth/forgot-password',
    submit: 'Enviar instruções',
  },
  reset: {
    title: 'Redefinir senha',
    endpoint: '/api/auth/reset-password',
    submit: 'Salvar nova senha',
  },
}

export function IdentityForm({ mode }: { mode: FormMode }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const payload: Record<string, string> = {}
    for (const key of ['email', 'password', 'token']) {
      const value = form.get(key)
      if (typeof value === 'string' && value.length > 0) payload[key] = value
    }

    try {
      const response = await fetch(settings[mode].endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as {
        error?: string
        message?: string
      }
      if (!response.ok) {
        setMessage(result.error ?? 'Não foi possível concluir a solicitação.')
        return
      }
      if (mode === 'login') {
        window.location.assign('/profile')
        return
      }
      setMessage(result.message ?? 'Operação concluída.')
    } catch {
      setMessage('Não foi possível conectar à aplicação.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="status-card auth-card">
        <p className="eyebrow">Tropa Fight</p>
        <h1>{settings[mode].title}</h1>
        <form className="identity-form" onSubmit={submit}>
          {mode !== 'reset' && (
            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          {mode === 'reset' && (
            <label>
              Token de recuperação
              <input name="token" required />
            </label>
          )}
          {(mode === 'register' || mode === 'login' || mode === 'reset') && (
            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                minLength={8}
                maxLength={128}
                required
              />
            </label>
          )}
          <button type="submit" disabled={busy}>
            {busy ? 'Aguarde…' : settings[mode].submit}
          </button>
        </form>
        <p className="form-message" role="status" aria-live="polite">
          {message}
        </p>
        <nav className="identity-links" aria-label="Navegação da conta">
          <a href="/">Início</a>
          {mode !== 'login' && <a href="/login">Entrar</a>}
          {mode !== 'register' && <a href="/register">Criar conta</a>}
          {mode !== 'forgot' && <a href="/forgot-password">Recuperar acesso</a>}
          {mode !== 'reset' && <a href="/reset-password">Redefinir senha</a>}
        </nav>
      </section>
    </main>
  )
}
