import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') return payload.message
  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) return payload.error.message
  return fallback
}

export async function GET(request: Request) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const params = new URLSearchParams()
  params.set('escopo', url.searchParams.get('escopo') || 'periodo')
  for (const key of ['inicio', 'fim', 'id_modulo', 'faturamento_status', 'q']) {
    const value = url.searchParams.get(key)
    if (value) params.set(key, value)
  }

  const result = await serverApiFetch(`app-store/admin/dashboard?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar a gestao da Agile Store.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
