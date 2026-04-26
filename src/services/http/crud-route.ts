import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import type { CrudResource } from '@/src/components/crud-base/types'

export type CrudRouteConfig = {
  resource: CrudResource
  listEmbed?: string
  allowMissingTableList?: boolean
}

function getErrorMessage(payload: unknown, fallback: string) {
  const rawMessage = typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
    ? payload.message
    : typeof payload === 'object'
      && payload !== null
      && 'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
        ? payload.error.message
        : ''

  if (/sqlstate|base table or view not found|unknown column|syntax error/i.test(rawMessage)) {
    return fallback
  }

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

function isMissingTableError(payload: unknown) {
  const message = typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
    ? payload.message
    : typeof payload === 'object'
      && payload !== null
      && 'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
        ? payload.error.message
        : ''

  return /sqlstate|base table or view not found/i.test(message)
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

export async function handleCrudCollectionGet(request: NextRequest, config: CrudRouteConfig) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams()
  params.set('page', searchParams.get('page') || '1')
  params.set('perpage', searchParams.get('perPage') || '15')
  params.set('order', searchParams.get('orderBy') || 'id')
  params.set('sort', searchParams.get('sort') || 'asc')

  const embed = searchParams.get('embed') || config.listEmbed
  if (embed) {
    params.set('embed', embed)
  }

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'embed'].includes(key) || !value.trim()) {
      continue
    }

    params.set(key, value)
  }

  const result = await serverApiFetch(`${config.resource}?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    if (config.allowMissingTableList && isMissingTableError(result.payload)) {
      return NextResponse.json({
        data: [],
        meta: {
          page: Number(searchParams.get('page') || 1),
          pages: 1,
          perPage: Number(searchParams.get('perPage') || 15),
          from: 0,
          to: 0,
          total: 0,
          order: searchParams.get('orderBy') || 'id',
          sort: searchParams.get('sort') || 'asc',
        },
      })
    }

    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os registros.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapListPayload(result.payload))
}

export async function handleCrudCollectionPost(request: NextRequest, config: CrudRouteConfig) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json()
  const result = await serverApiFetch(config.resource, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: typeof body === 'object' && body !== null && !Array.isArray(body)
      ? {
          ...body,
          id_empresa: session.currentTenantId,
        }
      : body,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o registro.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function handleCrudCollectionDelete(request: NextRequest, config: CrudRouteConfig) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json() as { ids?: unknown[] }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

  const result = await serverApiFetch(config.resource, {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id, id_empresa: session.currentTenantId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir os registros.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}

export async function handleCrudItemGet(request: NextRequest, config: CrudRouteConfig, id: string) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const params = new URLSearchParams()
  const embed = request.nextUrl.searchParams.get('embed')
  if (embed) {
    params.set('embed', embed)
  }

  const query = params.size ? `?${params.toString()}` : ''
  const result = await serverApiFetch(`${config.resource}/${id}${query}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (result.ok) {
    return NextResponse.json(result.payload)
  }

  const fallbackParams = new URLSearchParams(params)
  fallbackParams.set('id', id)
  fallbackParams.set('perpage', '1')

  const fallback = await serverApiFetch(`${config.resource}?${fallbackParams.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!fallback.ok) {
    return NextResponse.json({ message: getErrorMessage(fallback.payload, getErrorMessage(result.payload, 'Nao foi possivel carregar o registro.')) }, { status: fallback.status || result.status || 400 })
  }

  const fallbackPayload = fallback.payload
  if (
    typeof fallbackPayload === 'object'
    && fallbackPayload !== null
    && 'data' in fallbackPayload
    && Array.isArray(fallbackPayload.data)
  ) {
    const [record] = fallbackPayload.data
    if (record) {
      return NextResponse.json(record)
    }

    return NextResponse.json({ message: 'Registro nao encontrado.' }, { status: 404 })
  }

  return NextResponse.json(fallbackPayload)
}
