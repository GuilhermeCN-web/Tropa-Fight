import type { NextRequest } from 'next/server'
import {
  addFavorite,
  removeFavorite,
} from '../../../../../src/modules/favorites/presentation/http'

type Context = { params: Promise<{ productId: string }> }

export async function POST(request: NextRequest, context: Context) {
  const { productId } = await context.params
  return addFavorite(request, productId)
}

export async function DELETE(request: NextRequest, context: Context) {
  const { productId } = await context.params
  return removeFavorite(request, productId)
}
