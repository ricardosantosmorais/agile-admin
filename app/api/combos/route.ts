import { NextRequest } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet, handleCrudCollectionPost } from '@/src/services/http/crud-route'

const config = {
  resource: 'promocoes' as const,
  listEmbed: 'grupo,url',
}

export function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export function POST(request: NextRequest) {
  return handleCrudCollectionPost(request, config)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
