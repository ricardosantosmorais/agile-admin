import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { normalizeRelatorioProcessoLogsResponse } from '@/src/features/relatorios/services/relatorios-mappers'
import { extractApiErrorMessage } from '@/app/api/relatorios/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const search = request.nextUrl.searchParams
  const page = Math.max(1, Number(search.get('page') || 1))
  const perPage = Math.min(100, Math.max(1, Number(search.get('perPage') || 30)))
  const query = new URLSearchParams({
    page: String(page),
    perpage: String(perPage),
    id_empresa: session.currentTenantId,
    id_processo: id,
    order: 'created_at',
    sort: 'desc',
  })

  const result = await serverApiFetch(`processos/logs?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(result.payload, 'Não foi possível carregar os logs do processo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(normalizeRelatorioProcessoLogsResponse(result.payload, { page, perPage }))
}
