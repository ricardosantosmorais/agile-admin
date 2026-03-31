import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { encodeProdutoEmbalagemRowId } from '@/src/features/produtos/services/produto-relations'
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
    order: 'nome',
    sort: 'asc',
    id_produto: id,
    embed: 'filial',
  })

  const result = await serverApiFetch(`produtos_embalagens?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as embalagens do produto.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  const data = Array.isArray(payload.data)
    ? payload.data.map((item) => ({
        ...item,
        id: encodeProdutoEmbalagemRowId({
          id: String(item.id || '').trim() || null,
          id_produto: String(item.id_produto || ''),
          id_filial: String(item.id_filial || ''),
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
  }
  delete (payload as Record<string, unknown>).id

  const result = await serverApiFetch('produtos_embalagens', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar a embalagem do produto.') }, { status: result.status || 400 })
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
    id: String(row.id || '').trim() || null,
    id_produto: String(row.id_produto || ''),
    id_filial: String(row.id_filial || ''),
  }))

  const result = await serverApiFetch('produtos_embalagens', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível excluir as embalagens do produto.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
