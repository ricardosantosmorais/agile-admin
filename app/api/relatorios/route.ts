import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { normalizeRelatorioListResponse } from '@/src/features/relatorios/services/relatorios-mappers'
import { extractApiErrorMessage, resolveRelatorioSortField } from '@/app/api/relatorios/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams
  const page = Math.max(1, Number(search.get('page') || 1))
  const perPage = Math.min(1000, Math.max(1, Number(search.get('perPage') || 15)))
  const orderBy = search.get('orderBy') || 'codigo'
  const sort = search.get('sort') === 'desc' ? 'desc' : 'asc'
  const query = new URLSearchParams({
    page: String(page),
    perpage: String(perPage),
    ativo: '1',
    embed: 'grupo',
    order: resolveRelatorioSortField(orderBy),
    sort,
  })

  const codigo = String(search.get('codigo') || '').trim()
  const grupo = String(search.get('grupo') || '').trim()
  const nome = String(search.get('nome') || '').trim()

  if (codigo) query.set('codigo::like', codigo)
  if (grupo) query.set('grupo:nome::like', grupo)
  if (nome) query.set('nome::like', nome)

  const result = await serverApiFetch(`relatorios?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(result.payload, 'Não foi possível carregar os relatórios.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(normalizeRelatorioListResponse(result.payload, { page, perPage }))
}
