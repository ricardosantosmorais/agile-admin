import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
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

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const originalResult = await serverApiFetch(`notificacoes?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!originalResult.ok) {
    return NextResponse.json({ message: getErrorMessage(originalResult.payload, 'Nao foi possivel carregar a notificacao.') }, { status: originalResult.status || 400 })
  }

  const source = typeof originalResult.payload === 'object' && originalResult.payload !== null && 'data' in originalResult.payload && Array.isArray(originalResult.payload.data)
    ? originalResult.payload.data[0]
    : null

  if (!source || typeof source !== 'object') {
    return NextResponse.json({ message: 'Notificacao nao encontrada.' }, { status: 404 })
  }

  const titulo = String((source as Record<string, unknown>).titulo || '')
  const duplicatedTitle = `Copia de ${titulo}`.slice(0, 50)
  const result = await serverApiFetch('notificacoes', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [
      {
        id_empresa: session.currentTenantId,
        titulo: duplicatedTitle,
        mensagem: (source as Record<string, unknown>).mensagem ?? null,
        link: (source as Record<string, unknown>).link ?? null,
        data_envio: (source as Record<string, unknown>).data_envio ?? null,
        ativo: (source as Record<string, unknown>).ativo === true || (source as Record<string, unknown>).ativo === 1 || (source as Record<string, unknown>).ativo === '1',
        enviado: false,
      },
    ],
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel duplicar a notificacao.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
