import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const params = new URLSearchParams({
    page: '1',
    perpage: '1000',
    id_produto: id,
    embed: 'produto_relacionado.imagens',
    order: 'id_produto_relacionado',
    sort: 'asc',
  })

  const result = await serverApiFetch(`produtos/relacionados?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os produtos relacionados.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  return NextResponse.json(Array.isArray(payload.data) ? payload.data : [])
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const payload = [{
    id_empresa: session.currentTenantId,
    id_produto: id,
    id_produto_relacionado: String(body.id_produto_relacionado || '').trim(),
  }]

  const result = await serverApiFetch('produtos/relacionados', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar o produto relacionado.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []
  const payload = ids.map((relatedId) => ({
    id_empresa: session.currentTenantId,
    id_produto: id,
    id_produto_relacionado: relatedId,
  }))

  const result = await serverApiFetch('produtos/relacionados', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível excluir os produtos relacionados.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
