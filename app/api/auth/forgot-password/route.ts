import { NextResponse, type NextRequest } from 'next/server'
import { requestPasswordRecovery } from '../../../../src/modules/identity/application/identity-service'
import { UnconfiguredRecoveryEmail } from '../../../../src/modules/identity/application/recovery-email-port'

const genericResponse = {
  message:
    'If an account matches that email, recovery instructions will be sent.',
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    if (
      !body ||
      typeof body !== 'object' ||
      typeof (body as Record<string, unknown>).email !== 'string'
    ) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }
    await requestPasswordRecovery(
      (body as { email: string }).email,
      new UnconfiguredRecoveryEmail(),
    )
  } catch {
    // Keep the public response identical for existing and unknown accounts.
  }
  return NextResponse.json(genericResponse)
}
