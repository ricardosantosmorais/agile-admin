import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : ''
  const platform = body.platform === true

  const result = await serverApiFetch('clientes', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      id,
      [platform ? 'bloqueado_plataforma' : 'bloqueado']: false,
      logs: {
        descricao,
      },
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getMessage(result.payload, 'Nao foi possivel desbloquear o cliente.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
