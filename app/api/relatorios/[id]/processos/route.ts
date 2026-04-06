import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { normalizeRelatorioProcessosResponse } from '@/src/features/relatorios/services/relatorios-mappers'
import { extractApiErrorMessage, resolveProcessSortField } from '@/app/api/relatorios/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const search = request.nextUrl.searchParams
  const page = Math.max(1, Number(search.get('page') || 1))
  const perPage = Math.min(200, Math.max(1, Number(search.get('perPage') || 50)))
  const orderBy = search.get('orderBy') || 'created_at'
  const sort = search.get('sort') === 'asc' ? 'asc' : 'desc'

  const query = new URLSearchParams({
    page: String(page),
    perpage: String(perPage),
    embed: 'usuario,campos',
    id_empresa: session.currentTenantId,
    id_relatorio: id,
    order: resolveProcessSortField(orderBy),
    sort,
  })

  const processId = String(search.get('id') || '').trim()
  const usuario = String(search.get('usuario') || '').trim()
  const dataInicio = String(search.get('data_inicio') || '').trim()
  const dataFim = String(search.get('data_fim') || '').trim()
  const status = String(search.get('status') || '').trim()

  if (processId) query.set('id', processId)
  if (usuario) query.set('usuario:nome::like', usuario)
  if (dataInicio) query.set('created_at::ge', `${dataInicio} 00:00:00`)
  if (dataFim) query.set('created_at::le', `${dataFim} 23:59:59`)
  if (status) query.set('status', status)

  const result = await serverApiFetch(`processos?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(result.payload, 'Não foi possível carregar os processos do relatório.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(normalizeRelatorioProcessosResponse(result.payload, { page, perPage }))
}
