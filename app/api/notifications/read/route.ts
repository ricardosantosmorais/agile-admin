import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { extractNotificationApiMessage } from '@/src/features/notifications/services/notifications-mappers'
import type { NotificationReadReceipt } from '@/src/features/notifications/types/notifications'
import { serverApiFetch } from '@/src/services/http/server-api'

function isDuplicateReadError(payload: unknown) {
  const message = extractNotificationApiMessage(payload, '')
  return message.includes('Duplicate entry') && message.includes('notificacoes_push_logs.PRIMARY')
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()

  if (!session?.token || !session.currentTenantId) {
    return NextResponse.json({ message: 'Sessao nao encontrada.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        receipts?: NotificationReadReceipt[]
      }
    | null

  const receipts = Array.isArray(body?.receipts)
    ? body.receipts
      .filter((receipt) => receipt?.id)
      .map((receipt) => ({
        id: receipt.id,
        userId: receipt.userId || session.currentUserId,
      }))
      .filter((receipt) => receipt.userId)
    : []

  if (!receipts.length) {
    return NextResponse.json({ ok: true })
  }

  const result = await serverApiFetch('notificacoes_push/logs', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: receipts.map((receipt) => ({
      id_notificacao_push: receipt.id,
      id_usuario: receipt.userId,
    })),
  })

  if (!result.ok) {
    if (isDuplicateReadError(result.payload)) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { message: extractNotificationApiMessage(result.payload, 'Nao foi possivel confirmar a leitura.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
