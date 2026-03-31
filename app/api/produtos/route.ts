import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { handleCrudCollectionDelete } from '@/src/services/http/crud-route'
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

function mapListPayload(payload: unknown, assetsBucketUrl: string) {
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

  return {
    ...payload,
    data: payload.data.map((item) => {
      if (typeof item !== 'object' || item === null) {
        return item
      }

      const record = item as Record<string, unknown>
      const images = Array.isArray(record.imagens) ? (record.imagens as Array<Record<string, unknown>>) : []
      const first = images[0]
      const imagem = typeof first?.imagem === 'string' ? first.imagem : ''

      return {
        ...record,
        imagem_url: imagem && assetsBucketUrl
          ? `${assetsBucketUrl.replace(/\/+$/, '')}/produtos/${imagem}`
          : '',
      }
    }),
    meta: {
      page: Number((payload.meta as Record<string, unknown>).page || 1),
      pages: Number((payload.meta as Record<string, unknown>).pages || 1),
      perPage: Number((payload.meta as Record<string, unknown>).perpage || (payload.meta as Record<string, unknown>).perPage || 15),
      from: Number((payload.meta as Record<string, unknown>).from || 0),
      to: Number((payload.meta as Record<string, unknown>).to || 0),
      total: Number((payload.meta as Record<string, unknown>).total || 0),
      order: typeof (payload.meta as Record<string, unknown>).order === 'string' ? (payload.meta as Record<string, unknown>).order : '',
      sort: typeof (payload.meta as Record<string, unknown>).sort === 'string' ? (payload.meta as Record<string, unknown>).sort : '',
    },
  }
}

async function syncProdutoDepartamento(
  token: string,
  tenantId: string,
  produtoId: string,
  departamentoId: string | null,
) {
  const current = await serverApiFetch(`produtos/departamentos?page=1&perpage=1000&id_produto=${encodeURIComponent(produtoId)}`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (current.ok && Array.isArray((current.payload as { data?: unknown[] })?.data)) {
    const currentRows = ((current.payload as { data?: Array<Record<string, unknown>> }).data ?? [])
      .filter((row) => typeof row.id_departamento === 'string' || typeof row.id_departamento === 'number')

    if (currentRows.length > 0) {
      await serverApiFetch('produtos/departamentos', {
        method: 'DELETE',
        token,
        tenantId,
        body: currentRows.map((row) => ({
          id_empresa: tenantId,
          id_produto: produtoId,
          id_departamento: String(row.id_departamento),
        })),
      })
    }
  }

  if (!departamentoId) {
    return
  }

  await serverApiFetch('produtos/departamentos', {
    method: 'POST',
    token,
    tenantId,
    body: {
      id_empresa: tenantId,
      id_produto: produtoId,
      id_departamento: departamentoId,
    },
  })
}

async function syncProdutoGrades(
  token: string,
  tenantId: string,
  produtoId: string,
  gradesJson: unknown,
) {
  await serverApiFetch('produtos/grades_valores', {
    method: 'DELETE',
    token,
    tenantId,
    body: {
      id_produto: produtoId,
    },
  })

  const raw = typeof gradesJson === 'string' ? gradesJson : ''
  if (!raw.trim()) {
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = []
  }

  const payload = Array.isArray(parsed)
    ? parsed
        .map((item) => ({
          id_empresa: tenantId,
          id_produto: produtoId,
          id_grade: String((item as Record<string, unknown>).id_grade || '').trim(),
          id_valor: String((item as Record<string, unknown>).id_valor || '').trim(),
          id_sync: '',
        }))
        .filter((item) => item.id_grade && item.id_valor)
    : []

  if (payload.length === 0) {
    return
  }

  await serverApiFetch('produtos/grades_valores', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  })
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
    order: searchParams.get('orderBy') || 'nome',
    sort: searchParams.get('sort') || 'asc',
    embed: searchParams.get('embed') || 'imagens,url',
  })

  const idFilial = (searchParams.get('id_filial') || '').trim()

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'embed', 'id_filial'].includes(key) || !value.trim()) {
      continue
    }

    params.set(key, value)
  }

  if (idFilial) {
    params.set('q', `id in(SELECT id_produto from produtos_filiais where id_filial = '${idFilial}')`)
  }

  const result = await serverApiFetch(`produtos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar os produtos.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(mapListPayload(result.payload, ''))
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = (await request.json()) as Record<string, unknown>
  const payload: Record<string, unknown> = {
    ...body,
    id_empresa: session.currentTenantId,
  }
  delete payload.ids_grades_json

  const result = await serverApiFetch('produtos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível salvar o produto.') },
      { status: result.status || 400 },
    )
  }

  const savedRecord = Array.isArray(result.payload)
    ? (result.payload[0] as Record<string, unknown> | undefined)
    : (result.payload as Record<string, unknown> | null)

  const savedId = typeof savedRecord?.id === 'string' || typeof savedRecord?.id === 'number'
    ? String(savedRecord.id)
    : ''

  if (savedId) {
    const departamentoId = typeof body.id_departamento === 'string'
      ? body.id_departamento.trim() || null
      : typeof body.id_departamento === 'number'
        ? String(body.id_departamento)
        : null

    if (departamentoId) {
      await syncProdutoDepartamento(session.token, session.currentTenantId, savedId, departamentoId)
    }

    await syncProdutoGrades(session.token, session.currentTenantId, savedId, body.ids_grades_json)
  }

  return NextResponse.json(savedRecord ? [savedRecord] : [])
}

export async function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, { resource: 'produtos' })
}
