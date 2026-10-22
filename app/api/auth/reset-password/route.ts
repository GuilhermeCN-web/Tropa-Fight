import { NextResponse, type NextRequest } from 'next/server'
import {
  completePasswordRecovery,
  IdentityInputError,
} from '../../../../src/modules/identity/application/identity-service'

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

  const { token, password } = body as Record<string, unknown>
  if (typeof token !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Token and password are required.' },
      { status: 400 },
    )
  }

  try {
    const changed = await completePasswordRecovery(token, password)
    if (!changed)
      return NextResponse.json(
        { error: 'Recovery token is invalid or expired.' },
        { status: 400 },
      )
    return NextResponse.json({ passwordReset: true })
  } catch (error) {
    if (error instanceof IdentityInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Unable to reset the password.' },
      { status: 500 },
    )
  }
}
