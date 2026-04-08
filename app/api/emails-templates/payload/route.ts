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

function parsePayload(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }

  if (value == null) {
    return null
  }

  return value
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const tipo = String(request.nextUrl.searchParams.get('tipo') || '').trim()
  if (!tipo) {
    return NextResponse.json({ payload: null })
  }

  const params = new URLSearchParams({
    tipo,
  })

  const result = await serverApiFetch(`emails_payloads?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Nao foi possivel carregar o payload de exemplo.') },
      { status: result.status || 400 },
    )
  }

  const rows: unknown[] = (
    typeof result.payload === 'object'
    && result.payload !== null
    && 'data' in result.payload
    && Array.isArray(result.payload.data)
  ) ? result.payload.data : []

  const firstRow = rows.find((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
  const payload = parsePayload(firstRow?.payload)

  return NextResponse.json({
    payload,
    raw: firstRow ?? null,
  })
}
