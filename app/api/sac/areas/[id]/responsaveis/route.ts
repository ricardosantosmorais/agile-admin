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
  const result = await serverApiFetch(`sac/admin/areas/${encodeURIComponent(id)}/responsaveis`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os responsaveis da area do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function POST(request: Request, context: RouteContext) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const result = await serverApiFetch(`sac/admin/areas/${encodeURIComponent(id)}/responsaveis`, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o responsavel da area do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
