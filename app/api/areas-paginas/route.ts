import { NextRequest } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet, handleCrudCollectionPost } from '@/src/services/http/crud-route'
import { invalidateRemoteCacheService } from '@/src/services/http/cache-invalidation'

const config = { resource: 'areas_pagina' as const }

export function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export async function POST(request: NextRequest) {
  const response = await handleCrudCollectionPost(request, config)
  if (response.ok) {
    await invalidateRemoteCacheService('')
  }

  return response
}

export async function DELETE(request: NextRequest) {
  const response = await handleCrudCollectionDelete(request, config)
  if (response.ok) {
    await invalidateRemoteCacheService('')
  }

  return response
}
