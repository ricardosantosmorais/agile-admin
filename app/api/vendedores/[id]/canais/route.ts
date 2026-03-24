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
  const body = await request.json() as { id_canal_distribuicao?: string; limite_credito?: number | null }

  const result = await serverApiFetch('vendedores/canais_distribuicao', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      id_vendedor: id,
      id_canal_distribuicao: body.id_canal_distribuicao || null,
      limite_credito: body.limite_credito ?? null,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel vincular o canal ao vendedor.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { channelIds?: unknown[] }
  const channelIds = Array.isArray(body.channelIds) ? body.channelIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

  const result = await serverApiFetch('vendedores/canais_distribuicao', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: channelIds.map((channelId) => ({ id_vendedor: id, id_canal_distribuicao: channelId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel remover os canais do vendedor.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}

