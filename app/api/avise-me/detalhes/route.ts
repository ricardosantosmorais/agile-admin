import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { mapAvisemeDetailsPayload } from '@/src/features/produtos-aviseme/services/produtos-aviseme-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const idProduto = (request.nextUrl.searchParams.get('idProduto') || '').trim()
  const idFilial = (request.nextUrl.searchParams.get('idFilial') || '').trim()

  if (!idProduto || !idFilial) {
    return NextResponse.json({ message: 'Produto e filial sao obrigatorios.' }, { status: 400 })
  }

  const params = new URLSearchParams({
    perpage: '300',
    id_produto: idProduto,
    id_filial: idFilial,
    embed: 'produto,filial,cliente',
  })

  const result = await serverApiFetch(`produtos/aviseme?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Nao foi possivel carregar os detalhes do avise-me.' }, { status: result.status || 400 })
  }

  return NextResponse.json(mapAvisemeDetailsPayload(result.payload))
}
