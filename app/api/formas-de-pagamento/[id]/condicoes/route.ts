import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`formas_pagamento/${id}?embed=condicoes_pagamento.condicao_pagamento`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as condições de pagamento.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { condicoes_pagamento?: unknown[] }
  return NextResponse.json(Array.isArray(payload.condicoes_pagamento) ? payload.condicoes_pagamento : [])
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const result = await serverApiFetch('formas_pagamento/condicoes_pagamento', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...body,
      id_forma_pagamento: id,
      id_empresa: session.currentTenantId,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar a condição de pagamento.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { items?: Array<{ id_condicao_pagamento?: string }> }
  const items = Array.isArray(body.items) ? body.items : []

  const result = await serverApiFetch('formas_pagamento/condicoes_pagamento', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: items.map((item) => ({
      id_empresa: session.currentTenantId,
      id_forma_pagamento: id,
      id_condicao_pagamento: item.id_condicao_pagamento,
    })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível excluir as condições de pagamento.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
