import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

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

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const scope = request.nextUrl.searchParams.get('scope')
  const id = request.nextUrl.searchParams.get('id') || ''

  const route = scope === 'bairro'
    ? `cep/faixas/bairros?id_bairro=${encodeURIComponent(id)}&perpage=10000`
    : scope === 'cidade'
      ? `cep/faixas/cidades?id_cidade=${encodeURIComponent(id)}&perpage=10000`
      : `cep/faixas/estados?id=${encodeURIComponent(id)}&perpage=10000`

  const result = await serverApiFetch(route, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as faixas de CEP.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[] }
  return NextResponse.json(Array.isArray(payload.data) ? payload.data : [])
}
