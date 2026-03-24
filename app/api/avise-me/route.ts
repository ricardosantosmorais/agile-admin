import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { mapAvisemeListPayload } from '@/src/features/produtos-aviseme/services/produtos-aviseme-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const params = new URLSearchParams({
    page: request.nextUrl.searchParams.get('page') || '1',
    perpage: request.nextUrl.searchParams.get('perPage') || '15',
    order: request.nextUrl.searchParams.get('orderBy') || 'ultima_data_solicitacao',
    sort: request.nextUrl.searchParams.get('sort') || 'desc',
  })

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) {
      continue
    }
    params.set(key, value)
  }

  const result = await serverApiFetch(`produtos/aviseme/todos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Nao foi possivel carregar as solicitacoes de avise-me.' }, { status: result.status || 400 })
  }

  return NextResponse.json(mapAvisemeListPayload(result.payload))
}
