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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await readAuthSession()

  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const params = new URLSearchParams({
    id,
    page: '1',
    perpage: '1',
  })

  const embed = request.nextUrl.searchParams.get('embed')
  if (embed) {
    params.set('embed', embed)
  }

  const result = await serverApiFetch(`emails_templates?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Nao foi possivel carregar o registro.') },
      { status: result.status || 400 },
    )
  }

  const payload = result.payload
  const record = (
    typeof payload === 'object'
    && payload !== null
    && 'data' in payload
    && Array.isArray(payload.data)
  ) ? payload.data[0] : payload

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return NextResponse.json({ message: 'Registro nao encontrado.' }, { status: 404 })
  }

  return NextResponse.json(record)
}
