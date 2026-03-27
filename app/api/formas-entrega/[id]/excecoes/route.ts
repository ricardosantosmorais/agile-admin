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
  const result = await serverApiFetch(`formas_entrega/${id}?embed=excecoes`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as excecoes.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { excecoes?: unknown[] }
  return NextResponse.json(Array.isArray(payload.excecoes) ? payload.excecoes : [])
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const result = await serverApiFetch('formas_entrega/excecoes', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...body,
      id: null,
      id_forma_entrega: id,
      id_empresa: session.currentTenantId,
      ativo: true,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar a excecao.') }, { status: result.status || 400 })
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

  const result = await serverApiFetch('formas_entrega/excecoes', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((itemId) => ({ id_forma_entrega: id, id: itemId, id_empresa: session.currentTenantId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir as excecoes.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
