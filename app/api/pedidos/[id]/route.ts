import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { normalizePedidoDetail } from '@/src/features/pedidos/services/pedidos-mappers'
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const search = request.nextUrl.searchParams
  const query = new URLSearchParams()
  query.set('id', id)
  if (search.get('embed')) query.set('embed', search.get('embed') || '')

  const result = await serverApiFetch(`pedidos?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar o pedido.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[] }
  const record = Array.isArray(payload.data) ? payload.data[0] : null
  return NextResponse.json(record ? normalizePedidoDetail(record) : null)
}
