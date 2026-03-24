import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
  extractNotificationApiMessage,
  mapNotificationsListPayload,
} from '@/src/features/notifications/services/notifications-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()

  if (!session?.token || !session.currentTenantId) {
    return NextResponse.json({ message: 'Sessao nao encontrada.' }, { status: 401 })
  }

  const page = request.nextUrl.searchParams.get('page') ?? '1'
  const perpage = request.nextUrl.searchParams.get('perpage') ?? '20'
  const query = new URLSearchParams({
    page,
    perpage,
    id_empresa: session.currentTenantId,
    ...(session.currentUserId ? { id_usuario: session.currentUserId } : {}),
    order: 'created_at',
    sort: 'desc',
  })
  const result = await serverApiFetch(`notificacoes_push/admin/lista?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractNotificationApiMessage(result.payload, 'Nao foi possivel carregar as notificacoes.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(mapNotificationsListPayload(result.payload, session.currentUserId))
}
