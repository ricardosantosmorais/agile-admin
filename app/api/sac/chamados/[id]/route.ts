import { NextResponse } from 'next/server'
import { getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const { id } = await context.params
  const result = await serverApiFetch(`sac/admin/chamados/${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Chamado nao encontrado.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
