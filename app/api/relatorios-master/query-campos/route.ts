import { NextRequest, NextResponse } from 'next/server'
import { getPayloadMessage, normalizeApiList, postPainel, requireSession, toStringValue } from '@/app/api/relatorios-master/_shared'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

export async function GET(request: NextRequest) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const search = request.nextUrl.searchParams
  const idQuery = toStringValue(search.get('id_query') || search.get('idQuery'))
  if (!idQuery) return NextResponse.json({ data: [], meta: { page: 1, pages: 1, perPage: 100, from: 0, to: 0, total: 0 } })

  const page = Math.max(1, Number(search.get('page') || 1))
  const perPage = Math.min(1000, Math.max(1, Number(search.get('perPage') || 100)))
  const result = await externalAdminApiFetch('painelb2b', 'query_campos', {
    method: 'GET',
    query: {
      page,
      perpage: perPage,
      id_query: idQuery,
      field: search.get('orderBy') || 'id',
      sort: search.get('sort') === 'desc' ? 'desc' : 'asc',
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel carregar o mapeamento.') }, { status: result.status || 400 })
  }

  return NextResponse.json(normalizeApiList(result.payload, { page, perPage }))
}

export async function POST(request: NextRequest) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const idQuery = toStringValue(body.id_query || body.idQuery)

  if (!idQuery) return NextResponse.json({ message: 'Informe a query do campo.' }, { status: 400 })
  if (!toStringValue(body.titulo)) return NextResponse.json({ message: 'Informe o titulo do campo.' }, { status: 400 })
  if (!toStringValue(body.tipo)) return NextResponse.json({ message: 'Informe o tipo do campo.' }, { status: 400 })

  try {
    const saved = await postPainel('query_campos', {
      id: toStringValue(body.id),
      id_query: idQuery,
      titulo: toStringValue(body.titulo),
      tipo: toStringValue(body.tipo),
      ordenacao: toStringValue(body.ordenacao),
    }, 'Nao foi possivel salvar o campo.')
    return NextResponse.json(saved)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Nao foi possivel salvar o campo.' }, { status: 400 })
  }
}
