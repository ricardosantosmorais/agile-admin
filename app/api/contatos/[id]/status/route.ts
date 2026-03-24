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
  const body = await request.json() as { status?: string }
  const status = body.status === 'aprovado' ? 'aprovado' : body.status === 'reprovado' ? 'reprovado' : ''
  if (!status) {
    return NextResponse.json({ message: 'Status invalido.' }, { status: 400 })
  }

  const result = await serverApiFetch('contatos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      id,
      id_empresa: session.currentTenantId,
      status,
      internalizado: status === 'aprovado' ? false : undefined,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel atualizar o contato.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
