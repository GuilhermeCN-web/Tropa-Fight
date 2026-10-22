import 'server-only'
import { NextResponse } from 'next/server'
import { sessionCookieName } from '../application/session-service'

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(sessionCookieName, token, {
    ...cookieOptions,
    maxAge: 12 * 60 * 60,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(sessionCookieName, '', {
    ...cookieOptions,
    expires: new Date(0),
    maxAge: 0,
  })
}
