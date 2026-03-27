import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getErrorMessage(payload: unknown, fallback: string) {
  const rawMessage = typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
    ? payload.message
    : typeof payload === 'object'
      && payload !== null
      && 'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
        ? payload.error.message
        : ''

  if (/sqlstate|base table or view not found|unknown column|syntax error/i.test(rawMessage)) {
    return fallback
  }

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

function isMissingTableError(payload: unknown) {
  const message = typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
    ? payload.message
    : typeof payload === 'object'
      && payload !== null
      && 'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
        ? payload.error.message
        : ''

  return /sqlstate|base table or view not found/i.test(message)
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`formas_entrega/datas_entregas?id_forma_entrega=${encodeURIComponent(id)}&page=1&perpage=500&order=data&sort=asc`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    if (isMissingTableError(result.payload)) {
      return NextResponse.json([])
    }

    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as datas excepcionais.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[] }
  return NextResponse.json(Array.isArray(payload.data) ? payload.data : [])
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const result = await serverApiFetch('formas_entrega/datas_entregas', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...body,
      id_forma_entrega: id,
      id_empresa: session.currentTenantId,
    },
  })

  if (!result.ok) {
    const fallback = isMissingTableError(result.payload)
      ? 'Datas excepcionais indisponiveis para esta empresa.'
      : 'Nao foi possivel salvar a data excepcional.'
    return NextResponse.json({ message: getErrorMessage(result.payload, fallback) }, { status: result.status || 400 })
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

  const result = await serverApiFetch('formas_entrega/datas_entregas', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((itemId) => ({ id: itemId, id_forma_entrega: id, id_empresa: session.currentTenantId })),
  })

  if (!result.ok) {
    const fallback = isMissingTableError(result.payload)
      ? 'Datas excepcionais indisponiveis para esta empresa.'
      : 'Nao foi possivel excluir as datas excepcionais.'
    return NextResponse.json({ message: getErrorMessage(result.payload, fallback) }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
