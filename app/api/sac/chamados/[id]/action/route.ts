import { NextResponse } from 'next/server'
import { getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

const ACTION_ENDPOINTS = {
  respond: 'responder',
  'internal-note': 'nota-interna',
  status: 'status',
  assign: 'atribuir',
  transfer: 'transferir',
} as const

export async function POST(request: Request, context: RouteContext) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const body = await request.json().catch(() => ({})) as Record<string, unknown> & { action?: keyof typeof ACTION_ENDPOINTS }
  const endpointAction = body.action ? ACTION_ENDPOINTS[body.action] : undefined
  if (!endpointAction) {
    return NextResponse.json({ message: 'Acao invalida.' }, { status: 400 })
  }

  const { id } = await context.params
  const payload = { ...body }
  delete payload.action

  const result = await serverApiFetch(`sac/admin/chamados/${encodeURIComponent(id)}/${endpointAction}`, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel processar a acao do chamado.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
