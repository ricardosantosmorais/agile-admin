import { NextRequest } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionPost } from '@/src/services/http/crud-route'

const config = { resource: 'componentes_campos' as const }

export function POST(request: NextRequest) {
  return handleCrudCollectionPost(request, config)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
