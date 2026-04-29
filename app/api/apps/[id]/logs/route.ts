import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getApiErrorMessage } from '@/app/api/apps/_apps-data'

function mapListPayload(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('meta' in payload)) return payload
  const meta = (payload as { meta?: Record<string, unknown> }).meta ?? {}
  return {
    ...(payload as Record<string, unknown>),
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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams({
    id_app: id,
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    order: searchParams.get('orderBy') || 'created_at',
    sort: searchParams.get('sort') || 'desc',
  })

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) continue
    params.set(key, value)
  }

  const result = await serverApiFetch(`apps/logs?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getApiErrorMessage(result.payload, 'Não foi possível carregar os logs.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapListPayload(result.payload))
}
