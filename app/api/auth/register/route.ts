import { NextResponse, type NextRequest } from 'next/server'
import {
  IdentityInputError,
  registerCustomer,
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

  const { email, password } = body as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 },
    )
  }

  try {
    const userId = await registerCustomer(email, password)
    return NextResponse.json(
      {
        user: {
          id: userId,
          email: email.trim().toLowerCase(),
          status: 'ACTIVE',
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof IdentityInputError) {
      const status = error.message.includes('already exists') ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json(
      { error: 'Unable to create the account.' },
      { status: 500 },
    )
  }
}
