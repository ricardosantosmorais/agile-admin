import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serializeQuickPricingItems } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { id_produto?: string; items?: Array<Record<string, unknown>> }
  const idProduto = String(body.id_produto || '').trim()
  const items = Array.isArray(body.items) ? body.items : []

  if (!idProduto) {
    return NextResponse.json({ message: 'Produto é obrigatório.' }, { status: 400 })
  }

  const payload = serializeQuickPricingItems(items, idProduto, session.currentTenantId)

  const result = await serverApiFetch('produtos_tabelas_preco', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Não foi possível salvar a precificação rápida.' }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
