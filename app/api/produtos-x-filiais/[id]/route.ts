import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { decodeProdutoFilialId, encodeProdutoFilialId } from '@/src/features/produtos-filiais/services/produtos-filiais-keys'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const decoded = decodeProdutoFilialId(decodeURIComponent(id))
  const params = new URLSearchParams({
    page: '1',
    perpage: '1',
    embed: request.nextUrl.searchParams.get('embed') || 'produto,filial,tabela_preco,canal_distribuicao',
    id_produto: decoded.id_produto,
    id_filial: decoded.id_filial,
  })

  if (decoded.id_tabela_preco) params.set('id_tabela_preco', decoded.id_tabela_preco)
  if (decoded.id_canal_distribuicao_cliente) params.set('id_canal_distribuicao_cliente', decoded.id_canal_distribuicao_cliente)

  const result = await serverApiFetch(`produtos/filiais?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Não foi possível carregar o registro.' }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  const record = Array.isArray(payload.data) ? payload.data[0] : null
  if (!record) {
    return NextResponse.json({ message: 'Registro não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({
    ...record,
    id: encodeProdutoFilialId({
      id_produto: String(record.id_produto || ''),
      id_filial: String(record.id_filial || ''),
      id_tabela_preco: String(record.id_tabela_preco || '').trim() || null,
      id_canal_distribuicao_cliente: String(record.id_canal_distribuicao_cliente || '').trim() || null,
    }),
  })
}
