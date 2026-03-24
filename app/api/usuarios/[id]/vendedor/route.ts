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

function extractFirstRecord(payload: unknown) {
  if (typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data[0] ?? null
  }

  return payload
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const userResult = await serverApiFetch(`usuarios/${id}?embed=vendedor`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!userResult.ok) {
    return NextResponse.json({ message: getErrorMessage(userResult.payload, 'Nao foi possivel carregar o usuario.') }, { status: userResult.status || 400 })
  }

  const user = extractFirstRecord(userResult.payload) as Record<string, unknown> | null
  return NextResponse.json(user?.vendedor ?? null)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const userResult = await serverApiFetch(`usuarios/${id}?embed=vendedor`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!userResult.ok) {
    return NextResponse.json({ message: getErrorMessage(userResult.payload, 'Nao foi possivel carregar o usuario.') }, { status: userResult.status || 400 })
  }

  const user = extractFirstRecord(userResult.payload) as Record<string, unknown> | null
  const vendedor = user && typeof user.vendedor === 'object' && user.vendedor !== null
    ? user.vendedor as Record<string, unknown>
    : null

  const vendedorId = typeof vendedor?.id === 'string' ? vendedor.id : ''
  if (!vendedorId) {
    return NextResponse.json({ success: true })
  }

  const result = await serverApiFetch('vendedores', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [{
      id_empresa: session.currentTenantId,
      id: vendedorId,
      id_usuario: null,
    }],
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel remover o vendedor vinculado.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
