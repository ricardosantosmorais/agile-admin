import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const params = new URLSearchParams()
  const embed = request.nextUrl.searchParams.get('embed')
  if (embed) {
    params.set('embed', embed)
  }

  const result = await serverApiFetch(`compre_ganhe/${id}${params.size ? `?${params.toString()}` : ''}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar o registro.') }, { status: result.status || 400 })
  }

  if (typeof result.payload !== 'object' || result.payload === null) {
    return NextResponse.json(result.payload)
  }

  const payload = { ...result.payload } as Record<string, unknown>
  const groupId = typeof payload.id_grupo_promocao === 'number'
    ? String(payload.id_grupo_promocao)
    : typeof payload.id_grupo_promocao === 'string'
      ? payload.id_grupo_promocao
      : ''

  if (!groupId) {
    return NextResponse.json(payload)
  }

  const groupResult = await serverApiFetch(`grupos_promocao/${groupId}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (groupResult.ok && typeof groupResult.payload === 'object' && groupResult.payload !== null) {
    payload.grupo = groupResult.payload
  }

  return NextResponse.json(payload)
}
