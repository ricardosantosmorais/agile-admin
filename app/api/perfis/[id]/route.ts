import { NextResponse } from 'next/server'
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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const params = new URLSearchParams({
    id_empresa: session.currentTenantId,
    id,
  })

  const result = await serverApiFetch(`perfis?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar o perfil.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[] }
  const record = Array.isArray(payload.data) ? payload.data[0] : null

  if (!record) {
    return NextResponse.json({ message: 'Perfil nao encontrado.' }, { status: 404 })
  }

  return NextResponse.json(record)
}
