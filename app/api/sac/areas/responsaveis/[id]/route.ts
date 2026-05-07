import { NextResponse } from 'next/server'
import { getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const { id } = await context.params
  const result = await serverApiFetch(`sac/admin/areas/responsaveis/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel remover o responsavel da area do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
