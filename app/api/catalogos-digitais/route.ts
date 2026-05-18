import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

const MODULE_ID = 'mod_catalogos_digitais'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') return payload.message
  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) return payload.error.message
  return fallback
}

function escapeSearch(value: string) {
  return value.trim().replace(/'/g, "\\'")
}

function buildCatalogSearch(searchParams: URLSearchParams) {
  const globalSearch = escapeSearch(searchParams.get('q') || '')
  const code = escapeSearch(searchParams.get('code') || '')
  const name = escapeSearch(searchParams.get('name') || '')
  const clauses: string[] = []

  if (globalSearch) {
    clauses.push(`(nome like '%${globalSearch}%' or codigo = '${globalSearch}' or status = '${globalSearch}')`)
  }

  if (code) {
    clauses.push(`codigo like '%${code}%'`)
  }

  if (name) {
    clauses.push(`(nome like '%${name}%' or descricao like '%${name}%')`)
  }

  return clauses.join(' and ')
}

function findCatalogModule(payload: unknown) {
  const data = typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data) ? payload.data : []
  return data.find((item) => {
    if (typeof item !== 'object' || item === null) return false
    const record = item as Record<string, unknown>
    return record.id === MODULE_ID || record.slug === 'catalogos-digitais'
  }) ?? null
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function parseMetadata(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    try {
      return asRecord(JSON.parse(value) as unknown)
    } catch {
      return {}
    }
  }

  return asRecord(value)
}

function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function catalogValidity(row: unknown) {
  const record = asRecord(row)
  const metadata = parseMetadata(record.metadata)
  const snapshot = asRecord(metadata.snapshot)
  const outputs = asRecord(snapshot.saidas)

  return {
    from: parseDateOnly(String(metadata.vigencia_inicio || snapshot.vigencia_inicio || outputs.vigencia_inicio || '')),
    to: parseDateOnly(String(metadata.vigencia_fim || snapshot.vigencia_fim || outputs.vigencia_fim || '')),
  }
}

function matchesValidity(row: unknown, validFrom: string, validTo: string) {
  const filterFrom = parseDateOnly(validFrom)
  const filterTo = parseDateOnly(validTo)
  if (!filterFrom && !filterTo) return true

  const validity = catalogValidity(row)
  if (filterFrom && validity.to && validity.to < filterFrom) return false
  if (filterTo && validity.from && validity.from > filterTo) return false
  return true
}

function applyLocalValidityFilters(payload: unknown, page: number, perpage: number, validFrom: string, validTo: string) {
  const record = asRecord(payload)
  const rows = asArray(record.data)
  const filtered = rows.filter((row) => matchesValidity(row, validFrom, validTo))
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perpage))
  const start = (Math.max(1, page) - 1) * perpage
  const meta = asRecord(record.meta)

  return {
    ...record,
    data: filtered.slice(start, start + perpage),
    meta: {
      ...meta,
      page,
      perpage,
      total,
      pages,
    },
  }
}

function catalogCode() {
  return `CAT-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${Math.random().toString(16).slice(2, 10)}`
}

export async function GET(request: Request) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') || 1) || 1
  const perpage = Number(url.searchParams.get('perpage') || 15) || 15
  const validFrom = url.searchParams.get('validFrom') || ''
  const validTo = url.searchParams.get('validTo') || ''
  const hasLocalValidityFilters = Boolean(validFrom || validTo)
  const params = new URLSearchParams()
  params.set('page', hasLocalValidityFilters ? '1' : String(page))
  params.set('perpage', hasLocalValidityFilters ? '5000' : String(perpage))
  params.set('order', 'updated_at,created_at')
  params.set('sort', 'desc,desc')
  if (session.currentTenantId) params.set('id_empresa', session.currentTenantId)

  const search = buildCatalogSearch(url.searchParams)
  if (search) params.set('q', search)

  const status = url.searchParams.get('status')
  if (status) params.set('status', status)

  const [catalogsResult, appStoreResult] = await Promise.all([
    serverApiFetch(`catalogos_digitais?${params.toString()}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    }),
    serverApiFetch('app-store/modulos?page=1&perpage=60&q=Cat%C3%A1logos+Digitais', {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    }),
  ])

  if (!catalogsResult.ok) {
    return NextResponse.json({ message: getErrorMessage(catalogsResult.payload, 'Nao foi possivel carregar os catalogos digitais.') }, { status: catalogsResult.status || 400 })
  }

  return NextResponse.json({
    ...(typeof catalogsResult.payload === 'object' && catalogsResult.payload !== null
      ? hasLocalValidityFilters
        ? applyLocalValidityFilters(catalogsResult.payload, page, perpage, validFrom, validTo)
        : catalogsResult.payload
      : { data: [] }),
    appStore: appStoreResult.ok ? findCatalogModule(appStoreResult.payload) : { id: MODULE_ID, error: appStoreResult.payload },
  })
}

export async function POST(request: Request) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = asRecord(await request.json().catch(() => ({})))
  const id = String(body.id || '').trim() || catalogCode()
  const payload = {
    ...body,
    id,
    codigo: String(body.codigo || id).trim() || id,
    id_empresa: session.currentTenantId,
  }

  const result = await serverApiFetch('catalogos_digitais', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o catalogo digital.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: Request) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = asRecord(await request.json().catch(() => ({})))
  const ids = Array.isArray(body.ids)
    ? body.ids.map((id) => String(id).trim()).filter(Boolean)
    : []

  if (!ids.length) {
    return NextResponse.json({ message: 'Nenhum catalogo informado para exclusao.' }, { status: 400 })
  }

  const result = await serverApiFetch('catalogos_digitais', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({
      id,
      id_empresa: session.currentTenantId,
    })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir o catalogo digital.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
