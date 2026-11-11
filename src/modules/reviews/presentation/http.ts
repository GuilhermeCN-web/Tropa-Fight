import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '../../auth/presentation/request-identity'
import {
  ReviewError,
  parseAdminReviewQuery,
  parseReviewPage,
} from '../domain/review'
import { ReviewService } from '../application/review-service'
import { PostgresReviewRepository } from '../infrastructure/postgres-review-repository'

const service = new ReviewService(new PostgresReviewRepository())
const noStore = { 'Cache-Control': 'no-store' }

async function customer(request: NextRequest) {
  const access = await requirePermission(request, 'identity.profile.read:self')
  if (
    access.kind === 'authorized' &&
    access.principal.accountType === 'CUSTOMER'
  )
    return { customerId: access.principal.id } as const
  return {
    response: NextResponse.json(
      {
        error:
          access.kind === 'unauthenticated'
            ? 'Authentication required.'
            : 'Permission denied.',
      },
      {
        status: access.kind === 'unauthenticated' ? 401 : 403,
        headers: noStore,
      },
    ),
  } as const
}

async function objectBody(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function reviewError(error: unknown) {
  if (error instanceof ReviewError) {
    const status =
      error.code === 'VALIDATION'
        ? 400
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'NOT_ELIGIBLE'
            ? 403
            : 409
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status, headers: noStore },
    )
  }
  return NextResponse.json(
    { error: 'Unable to complete review operation.' },
    { status: 500, headers: noStore },
  )
}

function pageOrResponse(request: NextRequest) {
  try {
    return { page: parseReviewPage(request.nextUrl.searchParams) } as const
  } catch (error) {
    return { response: reviewError(error) } as const
  }
}

export async function getPublicReviews(
  request: NextRequest,
  productId: string,
) {
  const parsed = pageOrResponse(request)
  if ('response' in parsed) return parsed.response
  try {
    const result = await service.listPublished(productId, parsed.page)
    return result
      ? NextResponse.json(result, { headers: noStore })
      : NextResponse.json(
          { error: 'Product not found.' },
          { status: 404, headers: noStore },
        )
  } catch (error) {
    return reviewError(error)
  }
}

export async function createReview(request: NextRequest, productId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  const body = await objectBody(request)
  if (
    !body ||
    Object.keys(body).some((key) => !['rating', 'comment'].includes(key))
  )
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: noStore },
    )
  try {
    return NextResponse.json(
      { review: await service.create(access.customerId, productId, body) },
      { status: 201, headers: noStore },
    )
  } catch (error) {
    return reviewError(error)
  }
}

export async function getCustomerReviews(request: NextRequest) {
  const access = await customer(request)
  if ('response' in access) return access.response
  const parsed = pageOrResponse(request)
  if ('response' in parsed) return parsed.response
  try {
    return NextResponse.json(
      await service.listForCustomer(access.customerId, parsed.page),
      { headers: noStore },
    )
  } catch (error) {
    return reviewError(error)
  }
}

export async function updateReview(request: NextRequest, reviewId: string) {
  const access = await customer(request)
  if ('response' in access) return access.response
  const body = await objectBody(request)
  if (
    !body ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some((key) => !['rating', 'comment'].includes(key))
  )
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: noStore },
    )
  try {
    const review = await service.update(access.customerId, reviewId, body)
    return review
      ? NextResponse.json({ review }, { headers: noStore })
      : NextResponse.json(
          { error: 'Review not found.' },
          { status: 404, headers: noStore },
        )
  } catch (error) {
    return reviewError(error)
  }
}

/** Moderation is restricted to GENERAL_ADMIN (RF-037, ADR-011). */
async function generalAdmin(request: NextRequest) {
  const access = await requirePermission(request, 'identity.profile.read:self')
  if (access.kind === 'unauthenticated')
    return {
      response: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401, headers: noStore },
      ),
    } as const
  const principal = access.principal
  if (
    principal.status !== 'ACTIVE' ||
    principal.accountType !== 'ADMIN' ||
    !principal.roles.includes('GENERAL_ADMIN')
  )
    return {
      response: NextResponse.json(
        { error: 'Permission denied.' },
        { status: 403, headers: noStore },
      ),
    } as const
  return { actorId: principal.id } as const
}

export async function getModerationReviews(request: NextRequest) {
  const access = await generalAdmin(request)
  if ('response' in access) return access.response
  try {
    const query = parseAdminReviewQuery(request.nextUrl.searchParams)
    return NextResponse.json(await service.listForModeration(query), {
      headers: noStore,
    })
  } catch (error) {
    return reviewError(error)
  }
}

export async function moderateReview(request: NextRequest, reviewId: string) {
  const access = await generalAdmin(request)
  if ('response' in access) return access.response
  const body = await objectBody(request)
  if (!body)
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: noStore },
    )
  try {
    const review = await service.moderate(access.actorId, reviewId, body)
    return review
      ? NextResponse.json({ review }, { headers: noStore })
      : NextResponse.json(
          { error: 'Review not found.' },
          { status: 404, headers: noStore },
        )
  } catch (error) {
    if (error instanceof ReviewError && error.message === 'Invalid ID.')
      return NextResponse.json(
        { error: 'Review not found.' },
        { status: 404, headers: noStore },
      )
    return reviewError(error)
  }
}
