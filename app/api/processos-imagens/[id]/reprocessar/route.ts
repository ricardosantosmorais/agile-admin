import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const result = await serverApiFetch('processos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [{ id, status: 'criado' }],
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível reprocessar o processo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}
