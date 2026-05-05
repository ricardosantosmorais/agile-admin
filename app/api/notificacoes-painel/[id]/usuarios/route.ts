import { NextRequest, NextResponse } from 'next/server'
import { requireNotificationSession, getErrorMessage } from '@/app/api/notificacoes-painel/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapListPayload(payload: unknown) {
  if (
    typeof payload !== 'object'
    || payload === null
    || !('meta' in payload)
    || typeof payload.meta !== 'object'
    || payload.meta === null
    || !('data' in payload)
    || !Array.isArray(payload.data)
  ) {
    return payload
  }

  const meta = payload.meta as Record<string, unknown>
  return {
    ...payload,
    meta: {
      page: Number(meta.page || 1),
      pages: Number(meta.pages || 1),
      perPage: Number(meta.perpage || meta.perPage || 15),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
      total: Number(meta.total || 0),
      order: typeof meta.order === 'string' ? meta.order : '',
      sort: typeof meta.sort === 'string' ? meta.sort : '',
    },
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireNotificationSession()
  if (!session) return response

  const { id } = await context.params
  const searchParams = request.nextUrl.searchParams
  const orderBy = searchParams.get('orderBy') || 'data'
  const orderMap: Record<string, string> = {
    usuario: 'usuario:nome',
    empresa: 'empresa:nome_fantasia',
    data: 'data',
    canais: 'canais',
  }

  const params = new URLSearchParams({
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    id_notificacao: id,
    order: orderMap[orderBy] ?? orderBy,
    sort: searchParams.get('sort') || 'desc',
  })

  const result = await serverApiFetch(`notificacoes_painel/audiencia?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os usuários visualizadores.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapListPayload(result.payload))
}
