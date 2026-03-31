import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { encodeProdutoFilialRowId } from '@/src/features/produtos/services/produto-relations'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
  }
  return fallback
}

function parseBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const params = new URLSearchParams({
    page: '1',
    perpage: '1000',
    order: 'filial:nome_fantasia',
    sort: 'asc',
    id_produto: id,
    embed: 'filial,tabela_preco,canal_distribuicao',
  })

  const result = await serverApiFetch(`produtos/filiais?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as filiais do produto.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  const data = Array.isArray(payload.data)
    ? payload.data.map((item) => ({
        ...item,
        id: encodeProdutoFilialRowId({
          id_produto: String(item.id_produto || ''),
          id_filial: String(item.id_filial || ''),
          id_tabela_preco: String(item.id_tabela_preco || '').trim() || null,
          id_canal_distribuicao_cliente: String(item.id_canal_distribuicao_cliente || '').trim() || null,
        }),
      }))
    : []

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const payload = {
    ...body,
    id_empresa: session.currentTenantId,
    id_produto: id,
    ativo: parseBoolean(body.ativo),
    promocao_ecommerce: parseBoolean(body.promocao_ecommerce),
    estoque_positivo: parseBoolean(body.estoque_positivo),
  }
  delete (payload as Record<string, unknown>).id

  const result = await serverApiFetch('produtos/filiais', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar a filial do produto.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { rows?: Array<Record<string, unknown>> }
  const rows = Array.isArray(body.rows) ? body.rows : []
  const payload = rows.map((row) => ({
    id_empresa: session.currentTenantId,
    id_produto: String(row.id_produto || ''),
    id_filial: String(row.id_filial || ''),
    id_tabela_preco: String(row.id_tabela_preco || '').trim() || null,
    id_canal_distribuicao_cliente: String(row.id_canal_distribuicao_cliente || '').trim() || null,
  }))

  const result = await serverApiFetch('produtos/filiais', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível excluir as filiais do produto.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
