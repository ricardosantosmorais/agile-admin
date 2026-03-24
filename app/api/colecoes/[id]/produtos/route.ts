import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }
  return fallback
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json() as { items?: Array<{ id_produto?: string; id_tabela_preco?: string | null; posicao?: number | null }> }
  const items = Array.isArray(body.items) ? body.items : []

  const result = await serverApiFetch('colecoes/produtos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: items.map((item, index) => ({
      id_colecao: id,
      id_produto: item.id_produto || null,
      id_tabela_preco: item.id_tabela_preco || null,
      posicao: item.posicao ?? index + 1,
    })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel vincular os produtos.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json() as { items?: Array<{ id_produto?: string; id_tabela_preco?: string | null }> }
  const items = Array.isArray(body.items) ? body.items : []

  const result = await serverApiFetch('colecoes/produtos', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: items.map((item) => ({
      id_colecao: id,
      id_produto: item.id_produto || null,
      id_tabela_preco: item.id_tabela_preco || null,
    })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel remover os produtos.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
