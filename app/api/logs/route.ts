import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

function mapListPayload(payload: unknown) {
  if (
    typeof payload !== 'object'
    || payload === null
    || !('meta' in payload)
    || typeof payload.meta !== 'object'
    || payload.meta === null
    || !('data' in payload)
    || !Array.isArray(payload.data)
  ) {
    return payload
  }

  const meta = payload.meta as Record<string, unknown>
  return {
    ...payload,
    meta: {
      page: Number(meta.page || 1),
      pages: Number(meta.pages || 1),
      perPage: Number(meta.perpage || meta.perPage || 15),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
      total: Number(meta.total || 0),
      order: typeof meta.order === 'string' ? meta.order : '',
      sort: typeof meta.sort === 'string' ? meta.sort : '',
    },
  }
}

function mapUsersPayload(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return []
  }

  const users = payload.data
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      nome: typeof item.nome === 'string' ? item.nome : '',
    }))
    .filter((item) => item.id && item.nome)

  users.sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
  return users
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams
  const params = new URLSearchParams()
  params.set('page', search.get('page') || '1')
  params.set('perpage', search.get('perPage') || '15')
  params.set('order', search.get('orderBy') || 'data')
  params.set('sort', search.get('sort') || 'desc')

  for (const key of ['id_registro', 'modulo', 'id_usuario', 'data::ge', 'data::le', 'acao']) {
    const value = search.get(key)
    if (value && value.trim()) {
      params.set(key, value)
    }
  }

  const result = await serverApiFetch(`logs?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os logs.') }, { status: result.status || 400 })
  }

  const usersResult = await serverApiFetch(`empresas/usuarios/${encodeURIComponent(session.currentTenantId)}?perpage=1000`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  const mappedPayload = mapListPayload(result.payload)
  if (typeof mappedPayload !== 'object' || mappedPayload === null) {
    return NextResponse.json(mappedPayload)
  }

  const lookups = {
    users: usersResult.ok ? mapUsersPayload(usersResult.payload) : [],
  }

  return NextResponse.json({
    ...mappedPayload,
    lookups,
  })
}
