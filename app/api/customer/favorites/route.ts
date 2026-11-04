import type { NextRequest } from 'next/server'
import { getFavorites } from '../../../../src/modules/favorites/presentation/http'

export function GET(request: NextRequest) {
  return getFavorites(request)
}
