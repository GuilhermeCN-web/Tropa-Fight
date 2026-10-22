import { NextResponse, type NextRequest } from 'next/server'
import {
  sessionCookieName,
  principalFromCookie,
} from '../../../../src/modules/auth/application/session-service'
import { toPublicProfile } from '../../../../src/modules/identity/domain/identity-user'

export async function GET(request: NextRequest) {
  const principal = await principalFromCookie(
    request.cookies.get(sessionCookieName)?.value,
  )
  if (!principal) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({
    authenticated: true,
    user: toPublicProfile(principal),
  })
}
