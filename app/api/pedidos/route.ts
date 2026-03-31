import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { normalizePedidoListRecord } from '@/src/features/pedidos/services/pedidos-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
  }

  return fallback
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
    order: searchParams.get('orderBy') || 'data',
    sort: searchParams.get('sort') || 'desc',
  })

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) continue

    if (key === 'data_inicio') {
      params.set('data_inicio', `${value} 00:00:00`)
      continue
    }

    if (key === 'data_fim') {
      params.set('data_fim', `${value} 23:59:59`)
      continue
    }

    params.set(key, value)
  }

  const result = await serverApiFetch(`pedidos/todos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os pedidos.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[]; meta?: Record<string, unknown> }
  return NextResponse.json({
    data: Array.isArray(payload.data) ? payload.data.map(normalizePedidoListRecord) : [],
    meta: {
      page: Number(payload.meta?.page || 1),
      pages: Number(payload.meta?.pages || 1),
      perPage: Number(payload.meta?.perpage || 15),
      from: Number(payload.meta?.from || 0),
      to: Number(payload.meta?.to || 0),
      total: Number(payload.meta?.total || 0),
    },
  })
}
