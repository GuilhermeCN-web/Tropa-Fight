import type { NextRequest } from 'next/server'
import {
  createAdminUser,
  listAdminUsers,
} from '../../../../src/modules/identity/presentation/admin-users-http'

export function GET(request: NextRequest) {
  return listAdminUsers(request)
}

export function POST(request: NextRequest) {
  return createAdminUser(request)
}
