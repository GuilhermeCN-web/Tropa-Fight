import { NextResponse, type NextRequest } from 'next/server'
import { auditActions } from '../../../../src/modules/audit/domain/audit-event'
import { listAuditLogs } from '../../../../src/modules/audit/infrastructure/audit-repository'
import {
  principalFromCookie,
  sessionCookieName,
} from '../../../../src/modules/auth/application/session-service'

const results = new Set(['SUCCESS', 'FAILURE', 'DENIED'])
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validDate(value: string | null): value is string {
  return value !== null && !Number.isNaN(Date.parse(value))
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value
  const principal = await principalFromCookie(token)
  if (!principal) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (!principal.roles.includes('GENERAL_ADMIN')) {
    return NextResponse.json(
      { error: 'Permission denied.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const params = request.nextUrl.searchParams
  const pageValue = Number(params.get('page') ?? '1')
  const pageSizeValue = Number(params.get('pageSize') ?? '50')
  const actorId = params.get('actorId') ?? undefined
  const action = params.get('action') ?? undefined
  const result = params.get('result') ?? undefined
  const from = params.get('from') ?? undefined
  const to = params.get('to') ?? undefined

  if (
    !Number.isSafeInteger(pageValue) ||
    pageValue < 1 ||
    !Number.isSafeInteger(pageSizeValue) ||
    pageSizeValue < 1 ||
    pageSizeValue > 100 ||
    (actorId !== undefined && !uuidPattern.test(actorId)) ||
    (action !== undefined && !auditActions.some((value) => value === action)) ||
    (result !== undefined && !results.has(result)) ||
    (from !== undefined && !validDate(from)) ||
    (to !== undefined && !validDate(to)) ||
    (from && to && Date.parse(from) > Date.parse(to))
  ) {
    return NextResponse.json(
      { error: 'Invalid audit query.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const data = await listAuditLogs({
      page: pageValue,
      pageSize: pageSizeValue,
      actorId,
      action,
      resourceType: params.get('resourceType') ?? undefined,
      resourceId: params.get('resourceId') ?? undefined,
      result,
      from,
      to,
    })
    return NextResponse.json(
      { ...data, page: pageValue, pageSize: pageSizeValue },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'Unable to query audit logs.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
