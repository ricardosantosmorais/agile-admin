import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildContatoEditPayload } from '@/src/features/contatos/services/contatos-mappers'
import type { ContatoEditFormValues } from '@/src/features/contatos/types/contatos'
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

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function isTruthy(value: unknown) {
  if (typeof value === 'string') {
    return ['1', 'true', 'sim', 'yes', 'on'].includes(value.trim().toLowerCase())
  }

  return value === true || value === 1
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`contatos/${id}?embed=formularios,segmento`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar o contato.') }, { status: result.status || 400 })
  }

  return NextResponse.json(extractFirstRecord(result.payload))
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Partial<ContatoEditFormValues>

  const currentResult = await serverApiFetch(`contatos?id_empresa=${encodeURIComponent(session.currentTenantId)}&id=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!currentResult.ok) {
    return NextResponse.json({ message: getErrorMessage(currentResult.payload, 'Nao foi possivel carregar o contato para edicao.') }, { status: currentResult.status || 400 })
  }

  const currentContact = asRecord(extractFirstRecord(currentResult.payload))
  if (!currentContact.id) {
    return NextResponse.json({ message: 'Contato nao encontrado para edicao.' }, { status: 404 })
  }

  if (isTruthy(currentContact.internalizado)) {
    return NextResponse.json({ message: 'Nao e permitido editar contatos ja internalizados.' }, { status: 400 })
  }

  const payload = buildContatoEditPayload({
    ...body,
    id,
  } as ContatoEditFormValues)

  const result = await serverApiFetch('contatos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...payload,
      id_empresa: session.currentTenantId,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel atualizar o contato.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
