import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
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
    },
  }
}

function buildRawCodeFilter(value: string) {
  return `id%20in(SELECT%20id_usuario%20from%20vendedores%20where%20id%20like%20'%%25${value}%%25')`
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams({
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    order: searchParams.get('orderBy') || 'email',
    sort: searchParams.get('sort') || 'asc',
    embed: 'vendedor',
    'perfil::ne': 'empresa',
    id_empresa: session.currentTenantId,
  })

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) {
      continue
    }

    if (key === 'codigo::like') {
      params.set('q', buildRawCodeFilter(value.trim()))
      continue
    }

    if (key === 'ultimo_acesso::ge' || key === 'ultimo_pedido::ge') {
      params.set(key, `${value} 00:00:00`)
      continue
    }

    if (key === 'ultimo_acesso::le' || key === 'ultimo_pedido::le') {
      params.set(key, `${value} 23:59:59`)
      continue
    }

    params.set(key, value)
  }

  const result = await serverApiFetch(`usuarios?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os usuarios.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapListPayload(result.payload))
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json() as { ids?: unknown[] }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

  const result = await serverApiFetch('usuarios', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir os usuarios.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
