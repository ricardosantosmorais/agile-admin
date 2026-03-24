import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

const relationConfig: Record<string, { path: string; deleteMany?: boolean }> = {
  filiais: { path: 'clientes/filiais' },
  vendedores: { path: 'clientes_vendedores' },
  formas_pagamento: { path: 'clientes/formas_pagamento', deleteMany: true },
  condicoes_pagamento: { path: 'clientes/condicoes_pagamento', deleteMany: true },
}

function appendTenantId(payload: unknown, tenantId: string) {
  if (Array.isArray(payload)) {
    return payload.map((item) => (
      typeof item === 'object' && item !== null
        ? { ...item, id_empresa: tenantId }
        : item
    ))
  }

  if (typeof payload === 'object' && payload !== null) {
    return {
      ...payload,
      id_empresa: tenantId,
    }
  }

  return payload
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return fallback
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; relation: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { relation } = await context.params
  const config = relationConfig[relation]
  if (!config) {
    return NextResponse.json({ message: 'Relacao nao suportada.' }, { status: 404 })
  }

  const body = await request.json()
  const result = await serverApiFetch(config.path, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: appendTenantId(body, session.currentTenantId),
  })

  if (!result.ok) {
    const message = getApiErrorMessage(result.payload, 'Nao foi possivel salvar o vinculo.')
    return NextResponse.json({ message }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; relation: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { relation } = await context.params
  const config = relationConfig[relation]
  if (!config) {
    return NextResponse.json({ message: 'Relacao nao suportada.' }, { status: 404 })
  }

  const body = await request.json()

  const result = await serverApiFetch(config.path, {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: appendTenantId(
      config.deleteMany && Array.isArray(body.items)
        ? body.items
        : body,
      session.currentTenantId,
    ),
  })

  if (!result.ok) {
    const message = getApiErrorMessage(result.payload, 'Nao foi possivel excluir o vinculo.')
    return NextResponse.json({ message }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
