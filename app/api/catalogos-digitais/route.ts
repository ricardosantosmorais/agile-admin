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

function buildCatalogSearch(value: string) {
  const safe = value.trim().replace(/'/g, "\\'")
  if (!safe) return ''
  return `(nome like '%${safe}%' or codigo = '${safe}' or status = '${safe}')`
}

function findCatalogModule(payload: unknown) {
  const data = typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data) ? payload.data : []
  return data.find((item) => {
    if (typeof item !== 'object' || item === null) return false
    const record = item as Record<string, unknown>
    return record.id === MODULE_ID || record.slug === 'catalogos-digitais'
  }) ?? null
}

export async function GET(request: Request) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const params = new URLSearchParams()
  params.set('page', url.searchParams.get('page') || '1')
  params.set('perpage', url.searchParams.get('perpage') || '15')
  params.set('order', 'updated_at,created_at')
  params.set('sort', 'desc,desc')
  if (session.currentTenantId) params.set('id_empresa', session.currentTenantId)

  const search = buildCatalogSearch(url.searchParams.get('q') || '')
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
    ...(typeof catalogsResult.payload === 'object' && catalogsResult.payload !== null ? catalogsResult.payload : { data: [] }),
    appStore: appStoreResult.ok ? findCatalogModule(appStoreResult.payload) : { id: MODULE_ID, error: appStoreResult.payload },
  })
}
