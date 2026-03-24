import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
  extractNotificationApiMessage,
  mapNotificationDetailPayload,
} from '@/src/features/notifications/services/notifications-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await readAuthSession()

  if (!session?.token || !session.currentTenantId) {
    return NextResponse.json({ message: 'Sessao nao encontrada.' }, { status: 401 })
  }

  const { id } = await context.params
  const query = new URLSearchParams({
    id,
    embed: 'notificacao',
  })
  const detailResult = await serverApiFetch(`notificacoes_push?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!detailResult.ok) {
    return NextResponse.json(
      { message: extractNotificationApiMessage(detailResult.payload, 'Nao foi possivel carregar a notificacao.') },
      { status: detailResult.status || 400 },
    )
  }

  const notification = mapNotificationDetailPayload(detailResult.payload)

  if (!notification) {
    return NextResponse.json({ message: 'Notificacao nao encontrada.' }, { status: 404 })
  }

  if (notification.companyId && notification.companyId !== session.currentTenantId) {
    return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 })
  }

  return NextResponse.json(notification)
}
