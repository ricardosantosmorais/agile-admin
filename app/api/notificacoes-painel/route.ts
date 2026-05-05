import { NextRequest, NextResponse } from 'next/server'
import { handleCrudCollectionDelete } from '@/src/services/http/crud-route'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getErrorMessage } from '@/app/api/notificacoes-painel/_shared'

const config = { resource: 'notificacoes_painel' as const }

function withDayTime(value: string, endOfDay = false) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value} ${endOfDay ? '23:59:59' : '00:00:00'}` : value
}

function isValidPainelChannel(canal: unknown) {
  return ['admin', 'email', 'todos'].includes(String(canal ?? '').toLowerCase())
}

function readRowsForValidation(body: unknown) {
  return Array.isArray(body) ? body : [body]
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

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams({
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    order: searchParams.get('orderBy') || 'data_inicio',
    sort: searchParams.get('sort') || 'desc',
  })

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'embed'].includes(key) || !value.trim()) {
      continue
    }

    if (key === 'data_inicio::ge') {
      params.set(key, withDayTime(value))
    } else if (key === 'data_fim::le') {
      params.set(key, withDayTime(value, true))
    } else {
      params.set(key, value)
    }
  }

  const result = await serverApiFetch(`notificacoes_painel?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as notificações.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapListPayload(result.payload))
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json()
  const hasInvalidChannel = readRowsForValidation(body).some((row) => {
    if (typeof row !== 'object' || row === null || !('canal' in row)) return false
    return !isValidPainelChannel((row as { canal?: unknown }).canal)
  })

  if (hasInvalidChannel) {
    return NextResponse.json({ message: 'Canal inválido. Selecione Admin, E-mail ou Todos.' }, { status: 400 })
  }

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
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar a notificação.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
