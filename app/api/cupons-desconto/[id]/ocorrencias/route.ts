import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
      ? payload.error.message
      : fallback
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`cupons_desconto/ocorrencias?id_cupom_desconto=${encodeURIComponent(id)}&page=1&perpage=200&embed=canal_distribuicao,colecao,departamento,fornecedor,marca,produto,produto_pai`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as regras de aplicacao.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const payload = await request.json() as Record<string, unknown>
  const normalizedPayload = {
    ...payload,
    id: null,
    id_cupom_desconto: id,
  } as Record<string, unknown>

  if (normalizedPayload.tipo === 'produto' && typeof normalizedPayload.id_produto === 'string') {
    normalizedPayload.id_produto = normalizedPayload.id_produto.trim()
  }

  if (normalizedPayload.tipo === 'produto_pai' && typeof normalizedPayload.id_produto_pai === 'string') {
    normalizedPayload.id_produto_pai = normalizedPayload.id_produto_pai.trim()
  }

  const result = await serverApiFetch('cupons_desconto/ocorrencias', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: normalizedPayload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar a regra de aplicacao.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

  const result = await serverApiFetch('cupons_desconto/ocorrencias', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((itemId) => ({ id_cupom_desconto: id, id: itemId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir as regras de aplicacao.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
