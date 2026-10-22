import { NextResponse, type NextRequest } from 'next/server'
import {
  endSession,
  sessionCookieName,
} from '../../../../src/modules/auth/application/session-service'
import { clearSessionCookie } from '../../../../src/modules/auth/presentation/session-cookie'

export async function POST(request: NextRequest) {
  await endSession(request.cookies.get(sessionCookieName)?.value)
  const response = NextResponse.json({ authenticated: false })
  clearSessionCookie(response)
  return response
}
