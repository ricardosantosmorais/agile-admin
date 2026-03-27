import { NextRequest } from 'next/server'
import { handleCrudItemGet } from '@/src/services/http/crud-route'

const config = { resource: 'formas_entrega' as const }

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return handleCrudItemGet(request, config, id)
}
