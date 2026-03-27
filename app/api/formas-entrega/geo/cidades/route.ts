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

function buildInQuery(field: string, values: string[]) {
  return `${field}%20in('${values.join("','")}')`
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const ufs = (request.nextUrl.searchParams.get('ufs') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!ufs.length) {
    return NextResponse.json([])
  }

  const result = await serverApiFetch(`cep/cidades?fields=id_cidade,cidade,uf&perpage=10000&q=${buildInQuery('uf', ufs)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as cidades.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[] }
  return NextResponse.json(Array.isArray(payload.data) ? payload.data : [])
}

