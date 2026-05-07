import { NextResponse } from 'next/server'
import { forwardSearchParams, getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

const FILTER_KEYS = [
  'status',
  'id_sac_area',
  'id_sac_assunto',
  'cliente',
  'protocolo',
  'data_inicial',
  'data_final',
  'id_sac_chamado',
  'id_usuario_responsavel',
]

export async function GET(request: Request) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const query = forwardSearchParams(request, FILTER_KEYS, {
    page: new URL(request.url).searchParams.get('page') || '1',
    perpage: new URL(request.url).searchParams.get('perpage') || '15',
    order: new URL(request.url).searchParams.get('order') || 'ultima_interacao_em',
    sort: new URL(request.url).searchParams.get('sort') || 'desc',
  })

  const result = await serverApiFetch(`sac/admin/chamados?${query}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os chamados do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
