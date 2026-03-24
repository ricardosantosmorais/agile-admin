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

function readPromotionIdFromRequest(request: NextRequest, body?: Record<string, unknown>) {
  return request.nextUrl.searchParams.get('id_promocao')
    || (typeof body?.id_promocao === 'string' ? body.id_promocao : '')
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const promotionId = readPromotionIdFromRequest(request)
  if (!promotionId) {
    return NextResponse.json({ message: 'Combo nao informado.' }, { status: 400 })
  }

  const result = await serverApiFetch(`promocoes/produtos?id_promocao=${encodeURIComponent(promotionId)}&page=1&perpage=200&embed=produto,produto_pai,departamento,fornecedor,colecao,marca,embalagem`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os produtos do combo.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const payload = await request.json() as Record<string, unknown>
  const promotionId = readPromotionIdFromRequest(request, payload)
  if (!promotionId) {
    return NextResponse.json({ message: 'Combo nao informado.' }, { status: 400 })
  }

  const result = await serverApiFetch('promocoes/produtos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...payload,
      id_promocao: promotionId,
      id_sync: 9999,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o produto do combo.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json() as { id_promocao?: string; ids?: string[] }
  const promotionId = readPromotionIdFromRequest(request, body)
  if (!promotionId) {
    return NextResponse.json({ message: 'Combo nao informado.' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

  const result = await serverApiFetch('promocoes/produtos', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((itemId) => ({ id: itemId, id_promocao: promotionId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir os produtos do combo.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
