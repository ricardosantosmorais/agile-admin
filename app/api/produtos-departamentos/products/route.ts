import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function escapeQuery(value: string) {
  return value.replace(/'/g, "''")
}

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

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('perPage') || '30'
  const query = (searchParams.get('q') || '').trim()
  const onlyWithoutDepartment = searchParams.get('onlyWithoutDepartment') === '1'

  const params = new URLSearchParams({
    page,
    perpage: perPage,
    order: 'nome',
    sort: 'asc',
    fields: 'produtos.id,produtos.codigo,produtos.nome,produtos.id_departamento',
  })

  const filters: string[] = []
  if (query) {
    const safe = escapeQuery(query)
    filters.push(`(produtos.nome like '%${safe}%' or produtos.codigo like '%${safe}%' or produtos.id like '%${safe}%')`)
  }
  if (onlyWithoutDepartment) {
    filters.push('not exists (select 1 from produtos_departamentos where produtos.id = produtos_departamentos.id_produto)')
  }
  if (filters.length) {
    params.set('q', filters.join(' and '))
  }

  const result = await serverApiFetch(`produtos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os produtos.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[]; meta?: Record<string, unknown> }
  return NextResponse.json({
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: {
      page: Number(payload?.meta?.page || 1),
      pages: Number(payload?.meta?.pages || 1),
      perPage: Number(payload?.meta?.perpage || payload?.meta?.perPage || perPage),
      from: Number(payload?.meta?.from || 0),
      to: Number(payload?.meta?.to || 0),
      total: Number(payload?.meta?.total || 0),
    },
  })
}
