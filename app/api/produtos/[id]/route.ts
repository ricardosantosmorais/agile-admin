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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const embed = request.nextUrl.searchParams.get('embed')
    || 'canal_distribuicao,departamento,fornecedor,marca,produto_pai,url'
  const query = new URLSearchParams({ embed })

  const result = await serverApiFetch(`produtos/${id}?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar o produto.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}
