import { NextRequest, NextResponse } from 'next/server'
import { createPedidoStatus } from '@/app/api/pedidos/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

const DELIVERY_STATUSES = new Set([
  'aguardando',
  'pronto_retirada',
  'coletado',
  'em_transporte',
  'entregue',
])

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
  }

  return fallback
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const entregaId = String(body?.id || '').trim()

  if (!entregaId) {
    return NextResponse.json({ message: 'Entrega não encontrada.' }, { status: 400 })
  }

  const payload = {
    id: entregaId,
    id_empresa: session.currentTenantId,
    id_pedido: id,
    status: String(body?.status || '').trim(),
    rastreamento: String(body?.rastreamento || '').trim() || null,
    codigo: String(body?.codigo || '').trim() || null,
    prazo: body?.prazo === '' || body?.prazo === null || body?.prazo === undefined
      ? null
      : Number(body.prazo),
  }

  const result = await serverApiFetch('pedidos/entregas', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível atualizar a entrega.') }, { status: result.status || 400 })
  }

  if (DELIVERY_STATUSES.has(payload.status)) {
    const statusResult = await createPedidoStatus(session, { id }, payload.status)
    if (!statusResult.ok) {
      return NextResponse.json({ message: statusResult.message }, { status: statusResult.status || 400 })
    }
  }

  return NextResponse.json({ success: true, id })
}
