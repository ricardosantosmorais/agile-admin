import { NextRequest, NextResponse } from 'next/server'
import { fetchPainelFirst, getPayloadMessage, requireSession, toStringValue } from '@/app/api/relatorios-master/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const { id } = await context.params

  const result = await serverApiFetch(`relatorios?${new URLSearchParams({ id, perpage: '1' }).toString()}`, {
    method: 'GET',
    token: sessionOrResponse.token,
    tenantId: sessionOrResponse.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel carregar o relatorio.') }, { status: result.status || 400 })
  }

  const relatorio = asArray<Record<string, unknown>>(asRecord(result.payload).data).at(0)
  if (!relatorio) {
    return NextResponse.json({ message: 'Relatorio nao encontrado.' }, { status: 404 })
  }

  const api = toStringValue(relatorio.api)
  const endpoint = api ? await fetchPainelFirst('endpoints', { nome: api }) : {}
  const idQuery = toStringValue(endpoint.id_query)
  const query = idQuery ? await fetchPainelFirst('querys', { id: idQuery }) : {}

  return NextResponse.json({
    ...relatorio,
    endpoint,
    query_record: query,
    id_endpoint: toStringValue(endpoint.id),
    id_query: toStringValue(query.id || endpoint.id_query),
    query: toStringValue(query.query),
    hash: toStringValue(query.hash),
  })
}
