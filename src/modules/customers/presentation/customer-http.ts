import { NextResponse, type NextRequest } from 'next/server'
import {
  principalFromCookie,
  sessionCookieName,
} from '../../auth/application/session-service'
import { CustomerQueryService } from '../application/customer-query'
import {
  CustomerQueryValidationError,
  parseCustomerQuery,
} from '../domain/customer-query'
import { PostgresCustomerQueryRepository } from '../infrastructure/postgres-customer-query'

// Composition point for the database adapter (ADR-020).
const service = new CustomerQueryService(new PostgresCustomerQueryRepository())
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const noStore = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore })
}

/** Only GENERAL_ADMIN may consult customers (RF-034, RN-019). */
async function denyUnlessGeneralAdmin(
  request: NextRequest,
): Promise<Response | null> {
  const token = request.cookies.get(sessionCookieName)?.value
  const principal = await principalFromCookie(token)
  if (!principal) return json({ error: 'Authentication required.' }, 401)
  if (
    principal.accountType !== 'ADMIN' ||
    !principal.roles.includes('GENERAL_ADMIN')
  )
    return json({ error: 'Permission denied.' }, 403)
  return null
}

function failed() {
  return json({ error: 'Unable to query customers.' }, 500)
}

export async function getAdminCustomers(request: NextRequest) {
  const denied = await denyUnlessGeneralAdmin(request)
  if (denied) return denied
  let query
  try {
    query = parseCustomerQuery(request.nextUrl.searchParams)
  } catch (error) {
    if (error instanceof CustomerQueryValidationError)
      return json({ error: error.message }, 400)
    throw error
  }
  try {
    return json(await service.list(query))
  } catch {
    return failed()
  }
}

export async function getAdminCustomer(
  request: NextRequest,
  customerId: string,
) {
  const denied = await denyUnlessGeneralAdmin(request)
  if (denied) return denied
  const notFound = () => json({ error: 'Customer not found.' }, 404)
  if (!uuidPattern.test(customerId)) return notFound()
  try {
    const customer = await service.find(customerId)
    return customer ? json({ customer }) : notFound()
  } catch {
    return failed()
  }
}
