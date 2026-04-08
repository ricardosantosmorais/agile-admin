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

function buildUsersLookup(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return new Map<string, string>()
  }

  const lookup = new Map<string, string>()
  for (const item of payload.data) {
    if (typeof item !== 'object' || item === null) continue
    const id = 'id' in item ? String(item.id || '').trim() : ''
    const nome = 'nome' in item ? String(item.nome || '').trim() : ''
    if (id && nome) {
      lookup.set(id, nome)
    }
  }
  return lookup
}

function attachUserName(payload: unknown, usersLookup: Map<string, string>) {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return payload
  }

  const nextData = payload.data.map((row) => {
    if (typeof row !== 'object' || row === null) return row

    const idUsuario = 'id_usuario' in row ? String(row.id_usuario || '').trim() : ''
    const nomeUsuario = usersLookup.get(idUsuario) || ''
    if (!nomeUsuario) return row

    return {
      ...row,
      usuario: {
        nome: nomeUsuario,
      },
    }
  })

  return {
    ...payload,
    data: nextData,
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const templateId = String(id || '').trim()
  if (!templateId) {
    return NextResponse.json({ message: 'ID de template invalido.' }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams({
    id_registro: templateId,
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '50',
    order: searchParams.get('orderBy') || 'data',
    sort: searchParams.get('sort') || 'desc',
  })

  const result = await serverApiFetch(`emails_templates_historico?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Nao foi possivel carregar o historico do template.') },
      { status: result.status || 400 },
    )
  }

  const usersResult = await serverApiFetch(`empresas/usuarios/${encodeURIComponent(session.currentTenantId)}?perpage=1000`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  const usersLookup = usersResult.ok ? buildUsersLookup(usersResult.payload) : new Map<string, string>()
  return NextResponse.json(mapListPayload(attachUserName(result.payload, usersLookup)))
}
