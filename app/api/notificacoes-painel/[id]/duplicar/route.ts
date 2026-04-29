import { NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getErrorMessage, loadNotification, normalizeSavedPayload, requireNotificationSession } from '@/app/api/notificacoes-painel/_shared'
import type { CrudRecord } from '@/src/components/crud-base/types'

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'Sim'
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireNotificationSession()
  if (!session) return response

  const { id } = await context.params
  const loaded = await loadNotification(id, session.token, session.currentTenantId)
  if (!loaded.ok || !loaded.record) {
    return NextResponse.json({ message: getErrorMessage(loaded.payload, 'Não foi possível carregar a notificação.') }, { status: loaded.status || 404 })
  }

  const notificacao = loaded.record
  const payload: CrudRecord = {
    titulo: `Cópia de ${String(notificacao.titulo ?? '')}`,
    mensagem: notificacao.mensagem ?? null,
    canal: notificacao.canal ?? null,
    data_inicio: notificacao.data_inicio ?? null,
    data_fim: notificacao.data_fim ?? null,
    ativo: isTruthy(notificacao.ativo),
    registrar_changelog: isTruthy(notificacao.registrar_changelog),
    publicado: false,
    id_empresa: session.currentTenantId,
  }

  const result = await serverApiFetch('notificacoes_painel', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [payload],
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível duplicar a notificação.') }, { status: result.status || 400 })
  }

  return NextResponse.json(normalizeSavedPayload(result.payload))
}
