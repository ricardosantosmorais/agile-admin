import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapMeta(meta: Record<string, unknown>) {
  return {
    page: Number(meta.page || 1),
    pages: Number(meta.pages || 1),
    perPage: Number(meta.perpage || meta.perPage || 15),
    from: Number(meta.from || 0),
    to: Number(meta.to || 0),
    total: Number(meta.total || 0),
    order: typeof meta.order === 'string' ? meta.order : '',
    sort: typeof meta.sort === 'string' ? meta.sort : '',
  }
}

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams
  const includeChildren = search.get('incluirDependentes') === '1'
  const params = new URLSearchParams({
    page: search.get('page') || '1',
    perpage: search.get('perPage') || '15',
    order: search.get('orderBy') || 'created_at',
    sort: search.get('sort') || 'desc',
    embed: 'produto,produto_pai',
  })

  if (!includeChildren) {
    params.set('id_pai::nu', '')
  }

  for (const [key, value] of search.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'incluirDependentes'].includes(key) || !value.trim()) continue
    if (key === 'nome') {
      params.set('nome::like', value)
      continue
    }
    params.set(key, value)
  }

  const result = await serverApiFetch(`produtos_precificadores?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível carregar os registros.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>>; meta?: Record<string, unknown> }
  const data = Array.isArray(payload.data)
    ? payload.data.map((record) => ({
        ...record,
        wizardId: typeof record.id_pai === 'string' && record.id_pai.trim() ? record.id_pai : record.id,
      }))
    : []

  return NextResponse.json({ data, meta: mapMeta(payload.meta ?? {}) })
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []
  const payload = ids.map((id) => ({ id, id_empresa: session.currentTenantId }))

  const result = await serverApiFetch('produtos_precificadores', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível excluir os registros.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}

