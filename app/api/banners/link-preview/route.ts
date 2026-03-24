import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

const LINK_PARAM_BY_TYPE: Record<string, string> = {
  marca: 'id_marca',
  fornecedor: 'id_fornecedor',
  departamento: 'id_departamento',
  produto: 'id_produto',
  colecao: 'id_colecao',
  lista: 'id_lista',
  combo: 'id_promocao',
  brinde: 'id_brinde',
}

type ApiUrlRecord = {
  slug?: string | null
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const tipoLink = (request.nextUrl.searchParams.get('tipoLink') || '').trim()
  const objectId = (request.nextUrl.searchParams.get('objectId') || '').trim()
  const objectParam = LINK_PARAM_BY_TYPE[tipoLink]

  if (!objectParam || !objectId) {
    return NextResponse.json({ link: null })
  }

  const params = new URLSearchParams({
    page: '1',
    perpage: '1',
    [objectParam]: objectId,
  })

  const result = await serverApiFetch(`urls?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ link: null })
  }

  const payload = result.payload as { data?: ApiUrlRecord[] }
  const first = Array.isArray(payload?.data) ? payload.data[0] : null
  return NextResponse.json({ link: first?.slug || null })
}
