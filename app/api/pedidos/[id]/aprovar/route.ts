import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
  createPedidoLog,
  createPedidoStatus,
  fetchPedidoById,
  resolveRequestIp,
  updatePedido,
} from '@/app/api/pedidos/_shared'

function canApprovePayment(pedido: Record<string, unknown>) {
  const status = String(pedido.status || '')
  const internalizado = Boolean(pedido.internalizado)
  const pagamento = typeof pedido.pagamento === 'object' && pedido.pagamento !== null
    ? pedido.pagamento as Record<string, unknown>
    : null
  const formaTipo = String(pagamento?.forma_pagamento_convertida_tipo || pagamento?.forma_pagamento_tipo || '')

  return !internalizado
    && ['pagamento_em_analise', 'aguardando_pagamento'].includes(status)
    && formaTipo !== 'boleto_faturado'
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const pedidoResult = await fetchPedidoById(session, id)
  if (!pedidoResult.ok || !pedidoResult.pedido) {
    return NextResponse.json({ message: pedidoResult.message }, { status: pedidoResult.status || 400 })
  }

  const pedido = pedidoResult.pedido
  if (!canApprovePayment(pedido)) {
    return NextResponse.json({ message: 'Este pedido não pode ser aprovado manualmente.' }, { status: 409 })
  }

  const statusResult = await createPedidoStatus(session, pedido, 'pagamento_aprovado')
  if (!statusResult.ok) {
    return NextResponse.json({ message: statusResult.message }, { status: statusResult.status || 400 })
  }

  const logResult = await createPedidoLog(
    session,
    pedido,
    `Pagamento aprovado manualmente - Usuário ID: ${session.currentUserId} - IP: ${resolveRequestIp(request)}`,
  )
  if (!logResult.ok) {
    return NextResponse.json({ message: logResult.message }, { status: logResult.status || 400 })
  }

  const updateResult = await updatePedido(session, {
    id,
    status: 'pagamento_aprovado',
    internalizar: 1,
    aprovado: 1,
  })

  if (!updateResult.ok) {
    return NextResponse.json({ message: updateResult.message }, { status: updateResult.status || 400 })
  }

  return NextResponse.json({ success: true, id })
}
