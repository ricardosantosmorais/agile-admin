import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getErrorMessage, hydrateNotificationCompanies } from '@/app/api/notificacoes-painel/_shared'

const config = { resource: 'notificacoes_painel' as const }

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
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
    return NextResponse.json(await hydrateNotificationCompanies(result.payload, session.token, session.currentTenantId))
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

  const payload = fallback.payload
  if (
    typeof payload === 'object'
    && payload !== null
    && 'data' in payload
    && Array.isArray(payload.data)
  ) {
    const [record] = payload.data
    if (record) {
      return NextResponse.json(await hydrateNotificationCompanies(record, session.token, session.currentTenantId))
    }

    return NextResponse.json({ message: 'Registro nao encontrado.' }, { status: 404 })
  }

  return NextResponse.json(await hydrateNotificationCompanies(payload, session.token, session.currentTenantId))
}
