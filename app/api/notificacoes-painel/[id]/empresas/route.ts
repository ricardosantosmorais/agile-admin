import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getErrorMessage, loadNotification, normalizeSavedPayload, requireNotificationSession } from '@/app/api/notificacoes-painel/_shared'
import type { CrudRecord } from '@/src/components/crud-base/types'

function canalEnviaPushPainel(canal: unknown) {
  return ['admin', 'todos'].includes(String(canal ?? '').toLowerCase())
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireNotificationSession()
  if (!session) return response

  const { id } = await context.params
  const body = await request.json() as { id_empresa?: unknown; titulo?: unknown }
  const idEmpresa = String(body.id_empresa ?? '').trim()
  const titulo = String(body.titulo ?? 'Notificação').trim() || 'Notificação'

  if (!idEmpresa) {
    return NextResponse.json({ message: 'Informe a empresa para inclusão.' }, { status: 400 })
  }

  const loaded = await loadNotification(id, session.token, session.currentTenantId)
  if (!loaded.ok || !loaded.record) {
    return NextResponse.json({ message: getErrorMessage(loaded.payload, 'Não foi possível carregar a notificação.') }, { status: loaded.status || 404 })
  }

  if (canalEnviaPushPainel(loaded.record.canal)) {
    const pushPayload: CrudRecord[] = [{
      id_notificacao: id,
      id_empresa: idEmpresa,
      titulo: 'Notificação',
      mensagem: titulo,
      tipo: 'informacao',
      notificar_navegador: false,
      ativo: false,
    }]

    const push = await serverApiFetch('notificacoes_push', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: pushPayload,
    })

    if (!push.ok) {
      return NextResponse.json({ message: getErrorMessage(push.payload, 'Não foi possível criar a notificação push da empresa.') }, { status: push.status || 400 })
    }
  }

  const result = await serverApiFetch('notificacoes_painel/empresas', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: { id_notificacao: id, id_empresa: idEmpresa },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível vincular a empresa.') }, { status: result.status || 400 })
  }

  return NextResponse.json(normalizeSavedPayload(result.payload))
}

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireNotificationSession()
  if (!session) return response

  const body = await request.json() as { ids?: unknown[] }
  const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id ?? '').trim()).filter(Boolean) : []

  if (!ids.length) {
    return NextResponse.json({ message: 'Selecione um ou mais registros para exclusão.' }, { status: 400 })
  }

  const result = await serverApiFetch('notificacoes_painel/empresas', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível remover as empresas.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
