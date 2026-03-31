import { randomBytes } from 'node:crypto'
import type { NextRequest } from 'next/server'
import type { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type AuthSession = Awaited<ReturnType<typeof readAuthSession>>

type PedidoApiRecord = Record<string, unknown>

export function getPedidoErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }

    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }
  }

  return fallback
}

function generateNumericId() {
  return BigInt(`0x${randomBytes(8).toString('hex')}`).toString()
}

export function resolveRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || '-'
  }

  return request.headers.get('x-real-ip')?.trim() || '-'
}

export async function fetchPedidoById(session: NonNullable<AuthSession>, id: string) {
  const result = await serverApiFetch(`pedidos?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status,
      message: getPedidoErrorMessage(result.payload, 'Não foi possível carregar o pedido.'),
      pedido: null,
    }
  }

  const payload = result.payload as { data?: unknown[] }
  const pedido = Array.isArray(payload.data) && payload.data.length > 0
    ? (payload.data[0] as PedidoApiRecord)
    : null

  if (!pedido) {
    return {
      ok: false as const,
      status: 404,
      message: 'Pedido não encontrado.',
      pedido: null,
    }
  }

  return {
    ok: true as const,
    status: result.status,
    message: '',
    pedido,
  }
}

export async function createPedidoStatus(
  session: NonNullable<AuthSession>,
  pedido: PedidoApiRecord,
  status: string,
) {
  const payload = {
    id: generateNumericId(),
    id_empresa: session.currentTenantId,
    id_pedido: String(pedido.id || ''),
    data: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status,
  }

  const result = await serverApiFetch('pedidos/status', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status,
      message: getPedidoErrorMessage(result.payload, 'Não foi possível registrar o status do pedido.'),
    }
  }

  return { ok: true as const }
}

export async function createPedidoLog(
  session: NonNullable<AuthSession>,
  pedido: PedidoApiRecord,
  descricao: string,
) {
  const payload = {
    id: generateNumericId(),
    id_empresa: session.currentTenantId,
    id_pedido: String(pedido.id || ''),
    data: new Date().toISOString().slice(0, 19).replace('T', ' '),
    codigo: 'MANUAL',
    tipo: 'sucesso',
    descricao,
  }

  const result = await serverApiFetch('pedidos/log', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status,
      message: getPedidoErrorMessage(result.payload, 'Não foi possível registrar o log do pedido.'),
    }
  }

  return { ok: true as const }
}

export async function updatePedido(
  session: NonNullable<AuthSession>,
  payload: Record<string, unknown>,
) {
  const result = await serverApiFetch('pedidos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [payload],
  })

  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status,
      message: getPedidoErrorMessage(result.payload, 'Não foi possível atualizar o pedido.'),
    }
  }

  return {
    ok: true as const,
    payload: result.payload,
  }
}
