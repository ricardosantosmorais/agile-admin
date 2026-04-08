import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { asArray, asRecord } from '@/src/lib/api-payload'
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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`logs?page=1&perpage=1&id=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar o log.') }, { status: result.status || 400 })
  }

  const payload = asRecord(result.payload)
  const first = asArray(payload.data)[0]
  if (!first || typeof first !== 'object') {
    return NextResponse.json({ message: 'Log nao encontrado.' }, { status: 404 })
  }

  return NextResponse.json(first)
}

