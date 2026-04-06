import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = new URLSearchParams({
    id_empresa: session.currentTenantId,
    componente: '1',
    embed: 'filial',
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perpage') || '15',
    order: searchParams.get('field') || 'chave,descricao',
    sort: searchParams.get('sort') || 'asc',
  })

  const filters: Record<string, string> = {
    id: searchParams.get('id') || '',
    'chave::like': searchParams.get('chave') || '',
    'filial:nome_fantasia::like': searchParams.get('filial') || '',
    'descricao::like': searchParams.get('descricao') || '',
    'parametros::like': searchParams.get('parametros') || '',
    posicao: searchParams.get('posicao') || '',
    permissao: searchParams.get('permissao') || '',
    ativo: searchParams.get('ativo') || '',
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      query.set(key, value)
    }
  }

  const result = await serverApiFetch(`empresas/parametros?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar os parâmetros.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}
