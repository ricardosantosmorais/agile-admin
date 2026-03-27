import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

type CepRelation = {
  id?: string
  id_uf?: string | null
  id_cidade?: string | null
  id_bairro?: string | null
  estado?: { uf?: string; estado?: string | null } | null
  cidade?: { id_cidade?: string; cidade?: string | null; uf?: string | null } | null
  bairro?: { id_bairro?: string; bairro?: string | null; id_cidade?: string | null } | null
}

type RegraRecord = {
  id: string
  tipo: string
  nome?: string | null
  valor?: number | string | null
  prazo?: number | string | null
  ceps?: CepRelation[] | null
}

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

async function enrichRegras(session: Awaited<ReturnType<typeof readAuthSession>>, regras: RegraRecord[]) {
  if (!session) {
    return regras
  }

  const ufs = [...new Set(regras.flatMap((regra) => (regra.ceps ?? []).map((item) => item.id_uf).filter((item): item is string => Boolean(item))))]
  const cidades = [...new Set(regras.flatMap((regra) => (regra.ceps ?? []).map((item) => item.id_cidade).filter((item): item is string => Boolean(item))))]
  const bairros = [...new Set(regras.flatMap((regra) => (regra.ceps ?? []).map((item) => item.id_bairro).filter((item): item is string => Boolean(item))))]

  let estadosData: Array<{ uf: string; estado: string }> = []
  let cidadesData: Array<{ id_cidade: string; cidade: string; uf?: string | null }> = []
  let bairrosData: Array<{ id_bairro: string; bairro: string; id_cidade?: string | null }> = []

  if (ufs.length) {
    const result = await serverApiFetch(`cep/estados?fields=uf,estado&perpage=10000&q=${buildInQuery('uf', ufs)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })
    const payload = result.payload as { data?: Array<{ uf: string; estado: string }> }
    estadosData = Array.isArray(payload.data) ? payload.data : []
  }

  if (cidades.length) {
    const result = await serverApiFetch(`cep/cidades?fields=id_cidade,cidade,uf&perpage=10000&q=${buildInQuery('id_cidade', cidades)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })
    const payload = result.payload as { data?: Array<{ id_cidade: string; cidade: string; uf?: string | null }> }
    cidadesData = Array.isArray(payload.data) ? payload.data : []
  }

  if (bairros.length) {
    const result = await serverApiFetch(`cep/bairros?fields=id_bairro,bairro,id_cidade&perpage=10000&q=${buildInQuery('id_bairro', bairros)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })
    const payload = result.payload as { data?: Array<{ id_bairro: string; bairro: string; id_cidade?: string | null }> }
    bairrosData = Array.isArray(payload.data) ? payload.data : []
  }

  return regras.map((regra) => ({
    ...regra,
    ceps: (regra.ceps ?? []).map((cep) => {
      const bairro = cep.id_bairro ? bairrosData.find((item) => item.id_bairro === cep.id_bairro) ?? null : null
      const cidadeId = cep.id_cidade ?? bairro?.id_cidade ?? null
      const cidade = cidadeId ? cidadesData.find((item) => item.id_cidade === cidadeId) ?? null : null
      const estadoUf = cep.id_uf ?? cidade?.uf ?? null

      return {
        ...cep,
        id_cidade: cidadeId,
        id_uf: estadoUf,
        estado: estadoUf ? estadosData.find((item) => item.uf === estadoUf) ?? null : null,
        cidade,
        bairro,
      }
    }),
  }))
}

async function deleteLocalidades(
  session: NonNullable<Awaited<ReturnType<typeof readAuthSession>>>,
  regraId: string,
  ids: string[],
) {
  if (!ids.length) {
    return { ok: true, status: 200, payload: [] }
  }

  return serverApiFetch('formas_entrega/regras/cep', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id, id_forma_entrega_regra: regraId, id_empresa: session.currentTenantId })),
  })
}

async function deleteComplementares(session: NonNullable<Awaited<ReturnType<typeof readAuthSession>>>, formaEntregaId: string, regraId: string) {
  const current = await serverApiFetch(`formas_entrega/regras?id_forma_entrega=${encodeURIComponent(formaEntregaId)}&id_formas_entrega_regras_cepbr=${encodeURIComponent(regraId)}&page=1&perpage=500`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!current.ok) {
    return current
  }

  const payload = current.payload as { data?: Array<{ id?: string }> }
  const ids = (payload.data ?? []).map((item) => item.id).filter((item): item is string => Boolean(item))
  if (!ids.length) {
    return current
  }

  return serverApiFetch('formas_entrega/regras', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id, id_forma_entrega: formaEntregaId, id_empresa: session.currentTenantId })),
  })
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const searchParams = _request.nextUrl.searchParams
  const page = Math.max(Number(searchParams.get('page') || '1') || 1, 1)
  const perPage = Math.min(Math.max(Number(searchParams.get('perPage') || '15') || 15, 1), 200)
  const orderBy = (searchParams.get('orderBy') || 'nome').trim()
  const sort = searchParams.get('sort') === 'desc' ? 'desc' : 'asc'
  const nome = (searchParams.get('nome') || '').trim()
  const tipo = (searchParams.get('tipo') || '').trim()
  const valorFrom = (searchParams.get('valorFrom') || '').trim()
  const valorTo = (searchParams.get('valorTo') || '').trim()
  const prazoFrom = (searchParams.get('prazoFrom') || '').trim()
  const prazoTo = (searchParams.get('prazoTo') || '').trim()

  const params = new URLSearchParams({
    id_forma_entrega: id,
    page: String(page),
    perpage: String(perPage),
    embed: 'ceps',
    order: orderBy,
    sort,
  })
  params.append('id_formas_entrega_regras_cepbr::nu', '')

  if (nome) {
    params.set('nome::like', nome)
  }

  if (tipo) {
    params.set('tipo', tipo)
  }

  if (valorFrom) {
    params.set('valor::ge', valorFrom)
  }

  if (valorTo) {
    params.set('valor::le', valorTo)
  }

  if (prazoFrom) {
    params.set('prazo::ge', prazoFrom)
  }

  if (prazoTo) {
    params.set('prazo::le', prazoTo)
  }

  const result = await serverApiFetch(`formas_entrega/regras?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as regras.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: RegraRecord[] }
  const regras = Array.isArray(payload.data) ? payload.data : []
  const enriched = await enrichRegras(session, regras)
  const metaRecord = typeof result.payload === 'object' && result.payload !== null && 'meta' in result.payload
    ? (result.payload as { meta?: Record<string, unknown> }).meta ?? {}
    : {}

  return NextResponse.json({
    data: enriched,
    meta: {
      page: typeof metaRecord.page === 'number' ? metaRecord.page : page,
      pages: typeof metaRecord.pages === 'number' ? metaRecord.pages : 1,
      perPage: typeof metaRecord.perpage === 'number'
        ? metaRecord.perpage
        : typeof metaRecord.perPage === 'number'
          ? metaRecord.perPage
          : perPage,
      from: typeof metaRecord.from === 'number' ? metaRecord.from : (enriched.length ? ((page - 1) * perPage) + 1 : 0),
      to: typeof metaRecord.to === 'number' ? metaRecord.to : (enriched.length ? ((page - 1) * perPage) + enriched.length : 0),
      total: typeof metaRecord.total === 'number' ? metaRecord.total : enriched.length,
      order: typeof metaRecord.order === 'string' ? metaRecord.order : orderBy,
      sort: typeof metaRecord.sort === 'string' ? metaRecord.sort : sort,
    },
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const action = typeof body.action === 'string' ? body.action : ''

  if (action === 'localidades') {
    const regraId = String(body.regraId || '').trim()
    const payload = Array.isArray(body.payload) ? body.payload : []
    const deleteIds = Array.isArray(body.deleteIds)
      ? body.deleteIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []

    if (!regraId) {
      return NextResponse.json({ message: 'Regra invalida.' }, { status: 400 })
    }

    const deleted = await deleteLocalidades(session, regraId, [...new Set(deleteIds)])
    if (!deleted.ok) {
      return NextResponse.json({ message: getErrorMessage(deleted.payload, 'Nao foi possivel atualizar as localidades da regra.') }, { status: deleted.status || 400 })
    }

    if (!payload.length) {
      return NextResponse.json([])
    }

    const result = await serverApiFetch('formas_entrega/regras/cep', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: payload.map((item) => ({
        ...(item as Record<string, unknown>),
        id_empresa: session.currentTenantId,
        id_forma_entrega_regra: regraId,
      })),
    })

    if (!result.ok) {
      return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar as localidades da regra.') }, { status: result.status || 400 })
    }

    return NextResponse.json(result.payload)
  }

  if (action === 'complementares') {
    const regraId = String(body.regraId || '').trim()
    const payload = Array.isArray(body.payload) ? body.payload : []

    if (!regraId) {
      return NextResponse.json({ message: 'Regra invalida.' }, { status: 400 })
    }

    const deleted = await deleteComplementares(session, id, regraId)
    if (!deleted.ok) {
      return NextResponse.json({ message: getErrorMessage(deleted.payload, 'Nao foi possivel atualizar as regras complementares.') }, { status: deleted.status || 400 })
    }

    if (!payload.length) {
      return NextResponse.json([])
    }

    const result = await serverApiFetch('formas_entrega/regras', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: payload.map((item) => ({
        ...(item as Record<string, unknown>),
        id_empresa: session.currentTenantId,
        id_forma_entrega: id,
      })),
    })

    if (!result.ok) {
      return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar as regras complementares.') }, { status: result.status || 400 })
    }

    return NextResponse.json(result.payload)
  }

  const result = await serverApiFetch('formas_entrega/regras', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...body,
      id_forma_entrega: id,
      id_empresa: session.currentTenantId,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar a regra.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

  const result = await serverApiFetch('formas_entrega/regras', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((itemId) => ({ id_forma_entrega: id, id: itemId, id_empresa: session.currentTenantId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir as regras.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
