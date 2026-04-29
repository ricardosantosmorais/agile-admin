import { NextRequest, NextResponse } from 'next/server'
import { getPayloadMessage, normalizeApiList, normalizeRelatorioPayload, requireSession, saveQueryAndEndpoint, toStringValue } from '@/app/api/relatorios-master/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

  const search = request.nextUrl.searchParams
  const page = Math.max(1, Number(search.get('page') || 1))
  const perPage = Math.min(1000, Math.max(1, Number(search.get('perPage') || 15)))
  const params = new URLSearchParams({
    page: String(page),
    perpage: String(perPage),
    embed: 'grupo',
    order: search.get('orderBy') || 'id',
    sort: search.get('sort') === 'desc' ? 'desc' : 'asc',
    ativo: search.get('ativo') || '1',
  })

  for (const [key, value] of search.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'embed'].includes(key) || !value.trim()) continue
    params.set(key, value)
  }

  const result = await serverApiFetch(`relatorios?${params.toString()}`, {
    method: 'GET',
    token: sessionOrResponse.token,
    tenantId: sessionOrResponse.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel carregar os relatorios.') }, { status: result.status || 400 })
  }

  return NextResponse.json(normalizeApiList(result.payload, { page, perPage }))
}

export async function POST(request: NextRequest) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const payload = normalizeRelatorioPayload(body, sessionOrResponse.currentTenantId)

  if (toStringValue(payload.nome)) {
    const queryState = await saveQueryAndEndpoint(payload, sessionOrResponse.currentUserId)
    payload.id_query = toStringValue(queryState.query.id)
    payload.id_endpoint = queryState.endpointId
    if (queryState.api) payload.api = queryState.api
  }

  const result = await serverApiFetch('relatorios', {
    method: 'POST',
    token: sessionOrResponse.token,
    tenantId: sessionOrResponse.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel salvar o relatorio.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const body = await request.json().catch(() => ({})) as { ids?: unknown[] }
  const ids = Array.isArray(body.ids) ? body.ids.map((id) => toStringValue(id)).filter(Boolean) : []

  const result = await serverApiFetch('relatorios', {
    method: 'DELETE',
    token: sessionOrResponse.token,
    tenantId: sessionOrResponse.currentTenantId,
    body: ids.map((id) => ({ id, id_empresa: sessionOrResponse.currentTenantId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel excluir os relatorios.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
