import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { decodeProdutoFilialId, encodeProdutoFilialId } from '@/src/features/produtos-filiais/services/produtos-filiais-keys'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

function parseBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function withSyntheticId(record: Record<string, unknown>) {
  return {
    ...record,
    id: encodeProdutoFilialId({
      id_produto: String(record.id_produto || ''),
      id_filial: String(record.id_filial || ''),
      id_tabela_preco: String(record.id_tabela_preco || '').trim() || null,
      id_canal_distribuicao_cliente: String(record.id_canal_distribuicao_cliente || '').trim() || null,
    }),
  }
}

async function checkDuplicate(session: { token: string; currentTenantId: string }, body: Record<string, unknown>) {
  const params = new URLSearchParams({
    page: '1',
    perpage: '1',
    id_produto: String(body.id_produto || '').trim(),
    id_filial: String(body.id_filial || '').trim(),
  })

  const idTabelaPreco = String(body.id_tabela_preco || '').trim()
  const idCanal = String(body.id_canal_distribuicao_cliente || '').trim()
  if (idTabelaPreco) params.set('id_tabela_preco', idTabelaPreco)
  if (idCanal) params.set('id_canal_distribuicao_cliente', idCanal)

  const duplicate = await serverApiFetch(`produtos/filiais?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!duplicate.ok) {
    return null
  }

  const payload = duplicate.payload as { data?: Array<Record<string, unknown>> }
  return Array.isArray(payload.data) && payload.data.length > 0
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams({
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    order: searchParams.get('orderBy') || 'id_produto',
    sort: searchParams.get('sort') || 'desc',
    embed: searchParams.get('embed') || 'produto,filial,tabela_preco,canal_distribuicao',
  })

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'embed'].includes(key) || !value.trim()) {
      continue
    }
    params.set(key, value)
  }

  const result = await serverApiFetch(`produtos/filiais?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível carregar os registros.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>>; meta?: Record<string, unknown> }
  const data = Array.isArray(payload.data) ? payload.data.map(withSyntheticId) : []
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

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as Record<string, unknown>
  const isEditing = typeof body.id === 'string' && body.id.trim().length > 0
  if (!isEditing) {
    const duplicate = await checkDuplicate(session, body)
    if (duplicate) {
      return NextResponse.json({ message: 'Já existe uma tabela de preço para o produto informado!' }, { status: 400 })
    }
  }

  const payload: Record<string, unknown> = {
    ...body,
    id_empresa: session.currentTenantId,
    promocao_ecommerce: parseBoolean(body.promocao_ecommerce),
    estoque_positivo: parseBoolean(body.estoque_positivo),
    ativo: parseBoolean(body.ativo),
  }
  delete payload.id

  const result = await serverApiFetch('produtos/filiais', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível salvar o registro.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []
  const payload = ids
    .map((id) => decodeProdutoFilialId(id))
    .filter((item) => item.id_produto && item.id_filial)
    .map((item) => ({
      id_produto: item.id_produto,
      id_filial: item.id_filial,
      id_tabela_preco: item.id_tabela_preco,
      id_canal_distribuicao_cliente: item.id_canal_distribuicao_cliente,
      id_empresa: session.currentTenantId,
    }))

  const result = await serverApiFetch('produtos/filiais', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível excluir os registros.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
