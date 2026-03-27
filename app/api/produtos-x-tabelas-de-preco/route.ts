import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { encodeProdutoTabelaPrecoId } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams
  const params = new URLSearchParams({
    page: search.get('page') || '1',
    perpage: search.get('perPage') || '15',
    order: search.get('orderBy') || 'id_produto',
    sort: search.get('sort') || 'desc',
    embed: 'produto,tabela_preco',
  })

  for (const [key, value] of search.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) {
      continue
    }
    params.set(key, value)
  }

  const result = await serverApiFetch(`produtos_tabelas_preco?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Não foi possível carregar os registros.' }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>>; meta?: Record<string, unknown> }
  const data = Array.isArray(payload.data)
    ? payload.data.map((record) => ({
        ...record,
        id: encodeProdutoTabelaPrecoId(record.id_produto, record.id_tabela_preco),
      }))
    : []
  const meta = payload.meta ?? {}

  return NextResponse.json({
    data,
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
  })
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []
  const payload = ids
    .map((value) => value.split('|'))
    .filter((parts) => parts[0]?.trim() && parts[1]?.trim())
    .map(([id_produto, id_tabela_preco]) => ({
      id_produto: id_produto.trim(),
      id_tabela_preco: id_tabela_preco.trim(),
      id_empresa: session.currentTenantId,
    }))

  const result = await serverApiFetch('produtos_tabelas_preco', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Não foi possível excluir os registros.' }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
