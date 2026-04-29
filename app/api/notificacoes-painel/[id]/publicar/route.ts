import { NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getErrorMessage, loadNotification, normalizeSavedPayload, requireNotificationSession } from '@/app/api/notificacoes-painel/_shared'
import type { CrudRecord } from '@/src/components/crud-base/types'

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'Sim'
}

function normalizeRichHtml(value: unknown) {
  const normalized = String(value ?? '').replace(/\0/g, '').trim()
  if (!normalized) return ''
  let current = normalized
  for (let index = 0; index < 3; index += 1) {
    const decoded = current
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
    if (decoded === current) break
    current = decoded
  }
  return current.trim()
}

function mapCanalToChangelogPlataformas(canal: unknown) {
  const normalized = String(canal ?? '').toLowerCase()
  if (normalized === 'admin') return ['admin']
  if (normalized === 'email') return ['integracao']
  return ['ecommerce']
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
  const pushList = await serverApiFetch(`notificacoes_push?id_notificacao=${encodeURIComponent(id)}&perpage=1000`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!pushList.ok) {
    return NextResponse.json({ message: getErrorMessage(pushList.payload, 'Não foi possível carregar os envios vinculados.') }, { status: pushList.status || 400 })
  }

  const pushRows = typeof pushList.payload === 'object' && pushList.payload !== null && 'data' in pushList.payload && Array.isArray(pushList.payload.data)
    ? pushList.payload.data as CrudRecord[]
    : []

  if (pushRows.length > 0) {
    for (const push of pushRows) {
      if (!isTruthy(push.ativo)) {
        const result = await serverApiFetch('notificacoes_push/mensagem/empresa', {
          method: 'POST',
          token: session.token,
          tenantId: session.currentTenantId,
          body: {
            id: push.id,
            id_notificacao: push.id_notificacao,
            id_empresa: push.id_empresa,
            titulo: push.titulo,
            mensagem: push.mensagem,
            tipo: push.tipo,
            notificar_navegador: push.notificar_navegador,
          },
        })
        if (!result.ok) {
          return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível enviar a notificação para a empresa.') }, { status: result.status || 400 })
        }
      }
    }
  } else {
    const result = await serverApiFetch('notificacoes_push/mensagem/geral', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: {
        id_notificacao: id,
        titulo: 'Notificação',
        mensagem: notificacao.titulo,
        tipo: 'informacao',
        notificar_navegador: false,
      },
    })
    if (!result.ok) {
      return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível enviar a notificação geral.') }, { status: result.status || 400 })
    }
  }

  const payload: CrudRecord = {
    id,
    titulo: notificacao.titulo,
    data_inicio: notificacao.data_inicio,
    data_fim: notificacao.data_fim,
    ativo: isTruthy(notificacao.ativo),
    publicado: true,
    id_empresa: session.currentTenantId,
  }

  const result = await serverApiFetch('notificacoes_painel', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [payload],
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível publicar a notificação.') }, { status: result.status || 400 })
  }

  if (isTruthy(notificacao.registrar_changelog) && session.currentTenantId === 'agileecommerce') {
    const conteudo = normalizeRichHtml(notificacao.mensagem) || `<p>${String(notificacao.titulo ?? '')}</p>`
    for (const plataforma of mapCanalToChangelogPlataformas(notificacao.canal)) {
      const changelog = await serverApiFetch('changelog', {
        method: 'POST',
        token: session.token,
        tenantId: session.currentTenantId,
        body: {
          id_usuario: session.currentUserId,
          data: new Date().toISOString().slice(0, 19).replace('T', ' '),
          plataforma,
          tipo: 'melhoria',
          titulo: notificacao.titulo,
          conteudo,
          ativo: isTruthy(notificacao.ativo),
          apenas_master: false,
        },
      })

      if (!changelog.ok) {
        return NextResponse.json({
          message: `Notificação publicada, mas não foi possível registrar no changelog: ${getErrorMessage(changelog.payload, 'erro desconhecido')}`,
        }, { status: changelog.status || 400 })
      }
    }
  }

  return NextResponse.json(normalizeSavedPayload(result.payload))
}
