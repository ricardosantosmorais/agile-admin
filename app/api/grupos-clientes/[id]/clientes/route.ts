import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
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

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { clientIds?: unknown[] }
  const clientIds = Array.isArray(body.clientIds) ? body.clientIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

  const result = await serverApiFetch('grupos/clientes', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: clientIds.map((clientId) => ({ id_grupo: id, id_cliente: clientId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel vincular os clientes ao grupo.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { clientIds?: unknown[] }
  const clientIds = Array.isArray(body.clientIds) ? body.clientIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

  const result = await serverApiFetch('grupos/clientes', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: clientIds.map((clientId) => ({ id_grupo: id, id_cliente: clientId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel remover os clientes do grupo.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
