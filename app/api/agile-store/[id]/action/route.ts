import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

const ACTION_ENDPOINTS = {
  contract: 'contratar',
  cancel: 'descontratar',
  retry: 'reprocessar',
} as const

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

export async function POST(request: Request, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as {
    action?: keyof typeof ACTION_ENDPOINTS
    feedback?: {
      motive?: string
      message?: string
    }
  }
  const endpointAction = body.action ? ACTION_ENDPOINTS[body.action] : undefined
  if (!endpointAction) {
    return NextResponse.json({ message: 'Acao invalida.' }, { status: 400 })
  }

  const { id } = await context.params
  const actionBody: Record<string, unknown> = {
    id_empresa: session.currentTenantId,
    user_agent: request.headers.get('user-agent') ?? '',
  }

  if (body.action === 'contract' || body.action === 'cancel') {
    actionBody.feedback_motivo = String(body.feedback?.motive ?? '').trim()
    actionBody.feedback_mensagem = String(body.feedback?.message ?? '').trim()
  }

  const result = await serverApiFetch(`app-store/modulos/${encodeURIComponent(id)}/${endpointAction}`, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: actionBody,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel processar a acao do modulo.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
