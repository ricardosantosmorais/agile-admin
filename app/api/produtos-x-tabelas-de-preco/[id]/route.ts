import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { mapQuickPricingRows } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const idProduto = decodeURIComponent(id)

  const [tabelasResult, produtosTabelasResult, produtoResult] = await Promise.all([
    serverApiFetch('tabelas_preco?page=1&perpage=10000&order=nome&sort=asc', {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    }),
    serverApiFetch(`produtos_tabelas_preco?page=1&perpage=10000&id_produto=${encodeURIComponent(idProduto)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    }),
    serverApiFetch(`produtos?page=1&perpage=1&id=${encodeURIComponent(idProduto)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    }),
  ])

  if (!tabelasResult.ok || !produtosTabelasResult.ok) {
    return NextResponse.json({ message: 'Não foi possível carregar a precificação rápida.' }, { status: 400 })
  }

  const tabelas = (tabelasResult.payload as { data?: Array<Record<string, unknown>> }).data ?? []
  const produtosTabelas = (produtosTabelasResult.payload as { data?: Array<Record<string, unknown>> }).data ?? []
  const produto = ((produtoResult.payload as { data?: Array<Record<string, unknown>> }).data ?? [])[0] ?? null
  return NextResponse.json({
    id_produto: idProduto,
    produto_lookup: produto ? { id: String(produto.id || idProduto), label: String(produto.nome || produto.codigo || idProduto) } : { id: idProduto, label: idProduto },
    items: mapQuickPricingRows(tabelas, produtosTabelas, idProduto),
  })
}
