import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
  createPedidoLog,
  createPedidoStatus,
  fetchPedidoById,
  resolveRequestIp,
  updatePedido,
} from '@/app/api/pedidos/_shared'

function canCancelPedido(pedido: Record<string, unknown>) {
  const status = String(pedido.status || '')
  return !['carrinho', 'rascunho', 'cancelado'].includes(status) && pedido.brinde !== true
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { descricao?: string }
  const descricao = String(body.descricao || '').trim()

  if (!descricao) {
    return NextResponse.json({ message: 'Informe o motivo do cancelamento.' }, { status: 400 })
  }

  const pedidoResult = await fetchPedidoById(session, id)
  if (!pedidoResult.ok || !pedidoResult.pedido) {
    return NextResponse.json({ message: pedidoResult.message }, { status: pedidoResult.status || 400 })
  }

  const pedido = pedidoResult.pedido
  if (!canCancelPedido(pedido)) {
    return NextResponse.json({ message: 'Este pedido não pode ser cancelado.' }, { status: 409 })
  }

  const statusResult = await createPedidoStatus(session, pedido, 'cancelado')
  if (!statusResult.ok) {
    return NextResponse.json({ message: statusResult.message }, { status: statusResult.status || 400 })
  }

  const logResult = await createPedidoLog(
    session,
    pedido,
    `Pedido cancelado manualmente - ${descricao} - Usuário ID: ${session.currentUserId} - IP: ${resolveRequestIp(request)}`,
  )
  if (!logResult.ok) {
    return NextResponse.json({ message: logResult.message }, { status: logResult.status || 400 })
  }

  const updateResult = await updatePedido(session, {
    id,
    status: 'cancelado',
    internalizar: 0,
  })

  if (!updateResult.ok) {
    return NextResponse.json({ message: updateResult.message }, { status: updateResult.status || 400 })
  }

  return NextResponse.json({ success: true, id })
}
