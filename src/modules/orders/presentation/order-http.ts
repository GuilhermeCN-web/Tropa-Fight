import { NextResponse, type NextRequest } from 'next/server'
import {
  hasPermission,
  principalFromCookie,
  sessionCookieName,
} from '../../auth/application/session-service'
import { OrderQueryService } from '../application/order-query'
import {
  OrderQueryValidationError,
  parseOrderPage,
} from '../domain/order-query'
import { PostgresOrderQueryRepository } from '../infrastructure/postgres-order-query'

const service = new OrderQueryService(new PostgresOrderQueryRepository())
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const noStore = { 'Cache-Control': 'no-store' }

type AccessResult = { id: string } | { response: Response }

async function customer(request: NextRequest): Promise<AccessResult> {
  const token = request.cookies.get(sessionCookieName)?.value
  const principal = await principalFromCookie(token)
  if (!principal)
    return {
      response: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401, headers: noStore },
      ),
    }
  if (
    principal.accountType !== 'CUSTOMER' ||
    !hasPermission(principal, 'identity.profile.read:self')
  )
    return {
      response: NextResponse.json(
        { error: 'Permission denied.' },
        { status: 403, headers: noStore },
      ),
    }
  return { id: principal.id }
}

async function generalAdmin(request: NextRequest): Promise<AccessResult> {
  const token = request.cookies.get(sessionCookieName)?.value
  const principal = await principalFromCookie(token)
  if (!principal)
    return {
      response: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401, headers: noStore },
      ),
    }
  if (
    principal.accountType !== 'ADMIN' ||
    !principal.roles.includes('GENERAL_ADMIN')
  )
    return {
      response: NextResponse.json(
        { error: 'Permission denied.' },
        { status: 403, headers: noStore },
      ),
    }
  return { id: principal.id }
}

function pageOrResponse(request: NextRequest) {
  try {
    return { page: parseOrderPage(request.nextUrl.searchParams) }
  } catch (error) {
    if (error instanceof OrderQueryValidationError)
      return {
        response: NextResponse.json(
          { error: error.message },
          { status: 400, headers: noStore },
        ),
      }
    throw error
  }
}

function notFound() {
  return NextResponse.json(
    { error: 'Order not found.' },
    { status: 404, headers: noStore },
  )
}

function failed() {
  return NextResponse.json(
    { error: 'Unable to query orders.' },
    { status: 500, headers: noStore },
  )
}

export async function getCustomerOrders(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  try {
    const parsed = pageOrResponse(request)
    if ('response' in parsed) return parsed.response
    const result = await service.listForCustomer(access.id, parsed.page)
    return NextResponse.json(result, { headers: noStore })
  } catch {
    return failed()
  }
}

export async function getAdminOrders(request: NextRequest) {
  const access = await generalAdmin(request)
  if ('response' in access) return access.response
  try {
    const parsed = pageOrResponse(request)
    if ('response' in parsed) return parsed.response
    const result = await service.listForAdmin(parsed.page)
    return NextResponse.json(result, { headers: noStore })
  } catch {
    return failed()
  }
}

export async function getCustomerOrder(request: NextRequest, orderId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  if (!uuidPattern.test(orderId)) return notFound()
  try {
    const order = await service.findForCustomer(access.id, orderId)
    return order
      ? NextResponse.json({ order }, { headers: noStore })
      : notFound()
  } catch {
    return failed()
  }
}

export async function getAdminOrder(request: NextRequest, orderId: string) {
  const access = await generalAdmin(request)
  if ('response' in access) return access.response
  if (!uuidPattern.test(orderId)) return notFound()
  try {
    const order = await service.findForAdmin(orderId)
    return order
      ? NextResponse.json({ order }, { headers: noStore })
      : notFound()
  } catch {
    return failed()
  }
}

export async function getCustomerOrderTracking(
  request: NextRequest,
  orderId: string,
) {
  const access = await customer(request)
  if ('response' in access) return access.response
  if (!uuidPattern.test(orderId)) return notFound()
  try {
    const order = await service.findForCustomer(access.id, orderId)
    return order
      ? NextResponse.json(
          { shipment: order.shipment, tracking: order.tracking },
          { headers: noStore },
        )
      : notFound()
  } catch {
    return failed()
  }
}
