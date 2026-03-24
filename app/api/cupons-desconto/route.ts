import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { handleCrudCollectionDelete, handleCrudCollectionPost } from '@/src/services/http/crud-route'
import { serverApiFetch } from '@/src/services/http/server-api'

const config = { resource: 'cupons_desconto' as const }

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

function normalizeDecimalFilter(value: string) {
  const cleaned = value.trim().replace(/[^\d,.-]/g, '')
  if (!cleaned) {
    return ''
  }

  if (cleaned.includes('.') && cleaned.includes(',')) {
    return cleaned.replace(/\./g, '').replace(',', '.')
  }

  return cleaned.replace(',', '.')
}

function computeAvailabilityStatus(record: Record<string, unknown>, today: string) {
  const start = typeof record.data_inicio === 'string' ? record.data_inicio.slice(0, 10) : ''
  const end = typeof record.data_fim === 'string' ? record.data_fim.slice(0, 10) : ''

  if (start && start > today) {
    return 'upcoming'
  }

  if (end && end < today) {
    return 'expired'
  }

  return 'available'
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
    order: searchParams.get('orderBy') || 'id',
    sort: searchParams.get('sort') || 'desc',
  })

  const disponivel = searchParams.get('disponivel') || ''
  const today = new Date().toISOString().slice(0, 10)

  for (const [key, value] of searchParams.entries()) {
    if (!value.trim() || ['page', 'perPage', 'orderBy', 'sort', 'disponivel'].includes(key)) {
      continue
    }

    if (key === 'valor::ge' || key === 'valor::le') {
      const normalizedValue = normalizeDecimalFilter(value)
      if (normalizedValue) {
        params.set(key, normalizedValue)
      }
      continue
    }

    params.set(key, value)
  }

  if (disponivel === '1') {
    params.set('data_inicio::le', today)
    params.set('data_fim::ge', today)
  } else if (disponivel === '0') {
    params.set('data_fim::lt', today)
  } else if (disponivel === '2') {
    params.set('data_inicio::gt', today)
  }

  const result = await serverApiFetch(`cupons_desconto?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os registros.') }, { status: result.status || 400 })
  }

  const mapped = mapListPayload(result.payload) as { data?: Array<Record<string, unknown>> } | unknown
  if (typeof mapped === 'object' && mapped !== null && 'data' in mapped && Array.isArray(mapped.data)) {
    mapped.data = mapped.data.map((record) => ({
      ...record,
      disponivel: computeAvailabilityStatus(record, today),
    }))
  }

  return NextResponse.json(mapped)
}

export function POST(request: NextRequest) {
  return handleCrudCollectionPost(request, config)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
