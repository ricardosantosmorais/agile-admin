import { NextRequest } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet, handleCrudCollectionPost } from '@/src/services/http/crud-route'

const config = { resource: 'grupos_promocao' as const }

export function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export function POST(request: NextRequest) {
  return handleCrudCollectionPost(request, config)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
