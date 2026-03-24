import { NextRequest } from 'next/server'
import { handleCrudItemGet } from '@/src/services/http/crud-route'

const config = { resource: 'vendedores' as const }

export function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return context.params.then(({ id }) => handleCrudItemGet(request, config, id))
}

