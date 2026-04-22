import { NextRequest } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet, handleCrudCollectionPost } from '@/src/services/http/crud-route'

const config = { resource: 'empresas' as const }

export async function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export async function POST(request: NextRequest) {
  return handleCrudCollectionPost(request, config)
}

export async function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
