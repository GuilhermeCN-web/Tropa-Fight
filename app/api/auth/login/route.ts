import { NextResponse, type NextRequest } from 'next/server'
import {
  authenticate,
  InvalidCredentialsError,
} from '../../../../src/modules/identity/application/identity-service'
import { setSessionCookie } from '../../../../src/modules/auth/presentation/session-cookie'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    )
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    )
  }

  const { email, password } = body as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 },
    )
  }

  try {
    const token = await authenticate(email, password)
    const response = NextResponse.json({ authenticated: true })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 },
      )
    }
    return NextResponse.json(
      { error: 'Unable to authenticate.' },
      { status: 500 },
    )
  }
}
