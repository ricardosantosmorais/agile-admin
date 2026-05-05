import { NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getErrorMessage, loadNotification, normalizeSavedPayload, requireNotificationSession } from '@/app/api/notificacoes-painel/_shared'
import type { CrudRecord } from '@/src/components/crud-base/types'

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'Sim'
}

function readRows(payload: unknown): CrudRecord[] {
  if (typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data as CrudRecord[]
  }
  return []
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
  if (normalized === 'todos') return ['admin', 'integracao']
  return ['admin']
}

function canalEnviaPushPainel(canal: unknown) {
  return ['admin', 'todos'].includes(String(canal ?? '').toLowerCase())
}

function canalEnviaEmailPainel(canal: unknown) {
  return ['email', 'todos'].includes(String(canal ?? '').toLowerCase())
}

function isValidPainelChannel(canal: unknown) {
  return ['admin', 'email', 'todos'].includes(String(canal ?? '').toLowerCase())
}

function notificacaoPainelEstaVigente(notificacao: CrudRecord, now = new Date()) {
  const currentTime = now.getTime()
  const startValue = String(notificacao.data_inicio ?? '').trim()
  const endValue = String(notificacao.data_fim ?? '').trim()
  const startTime = startValue ? new Date(startValue.replace(' ', 'T')).getTime() : Number.NaN
  const endTime = endValue ? new Date(endValue.replace(' ', 'T')).getTime() : Number.NaN

  if (Number.isFinite(startTime) && startTime > currentTime) return false
  if (Number.isFinite(endTime) && endTime < currentTime) return false
  return true
}

function normalizeNotificacaoEmpresaIds(payload: unknown) {
  const ids = new Set<string>()
  for (const row of readRows(payload)) {
    const idEmpresa = String(row.id_empresa ?? '').trim()
    if (idEmpresa) ids.add(idEmpresa)
  }
  return Array.from(ids)
}

async function loadEmpresasNotificacaoPainel(id: string, token: string, tenantId: string) {
  const result = await serverApiFetch(`notificacoes_painel/empresas?id_notificacao=${encodeURIComponent(id)}&perpage=1000`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    return { ok: false as const, status: result.status || 400, payload: result.payload, ids: [] as string[] }
  }

  return { ok: true as const, status: 200, payload: result.payload, ids: normalizeNotificacaoEmpresaIds(result.payload) }
}

async function publicarPushPainel(notificacao: CrudRecord, idEmpresas: string[], token: string, tenantId: string) {
  const idNotificacao = String(notificacao.id ?? '').trim()
  const pushList = await serverApiFetch(`notificacoes_push?id_notificacao=${encodeURIComponent(idNotificacao)}&perpage=1000`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!pushList.ok) return pushList

  const pushPorEmpresa = new Map<string, CrudRecord>()
  for (const push of readRows(pushList.payload)) {
    const idEmpresa = String(push.id_empresa ?? '').trim()
    if (idEmpresa) pushPorEmpresa.set(idEmpresa, push)
  }

  if (idEmpresas.length > 0) {
    for (const idEmpresa of idEmpresas) {
      const existente = pushPorEmpresa.get(idEmpresa) ?? {}
      const result = await serverApiFetch('notificacoes_push/mensagem/empresa', {
        method: 'POST',
        token,
        tenantId,
        body: {
          ...(existente.id ? { id: existente.id } : {}),
          id_notificacao: idNotificacao,
          id_empresa: idEmpresa,
          titulo: existente.titulo ?? 'Notificação',
          mensagem: existente.mensagem ?? notificacao.titulo,
          tipo: existente.tipo ?? 'informacao',
          notificar_navegador: isTruthy(existente.notificar_navegador),
        },
      })
      if (!result.ok) return result
    }

    return { ok: true, status: 200, payload: { data: [] } }
  }

  return serverApiFetch('notificacoes_push/mensagem/geral', {
    method: 'POST',
    token,
    tenantId,
    body: {
      id_notificacao: idNotificacao,
      titulo: 'Notificação',
      mensagem: notificacao.titulo,
      tipo: 'informacao',
      notificar_navegador: false,
    },
  })
}

async function enviarEmailNotificacaoPainel(id: string, idEmpresas: string[], token: string, tenantId: string) {
  return serverApiFetch('notificacoes_painel/email', {
    method: 'POST',
    token,
    tenantId,
    body: {
      id_notificacao: id,
      id_empresas: idEmpresas,
    },
  })
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
  notificacao.id = id
  notificacao.canal = String(notificacao.canal ?? '').toLowerCase()

  if (!isValidPainelChannel(notificacao.canal)) {
    return NextResponse.json({ message: 'Canal inválido. Selecione Admin, E-mail ou Todos.' }, { status: 400 })
  }

  const empresas = await loadEmpresasNotificacaoPainel(id, session.token, session.currentTenantId)
  if (!empresas.ok) {
    return NextResponse.json({ message: getErrorMessage(empresas.payload, 'Não foi possível carregar as empresas da notificação.') }, { status: empresas.status || 400 })
  }

  const notificacaoVigente = notificacaoPainelEstaVigente(notificacao)

  if (notificacaoVigente && canalEnviaPushPainel(notificacao.canal)) {
    const push = await publicarPushPainel(notificacao, empresas.ids, session.token, session.currentTenantId)
    if (!push.ok) {
      return NextResponse.json({ message: getErrorMessage(push.payload, 'Não foi possível enviar a notificação do painel.') }, { status: push.status || 400 })
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

  if (notificacaoVigente && canalEnviaEmailPainel(notificacao.canal)) {
    const email = await enviarEmailNotificacaoPainel(id, empresas.ids, session.token, session.currentTenantId)
    if (!email.ok) {
      return NextResponse.json({
        message: `Notificação publicada, mas não foi possível enviar os e-mails: ${getErrorMessage(email.payload, 'erro desconhecido')}`,
      }, { status: email.status || 400 })
    }
  }

  if (notificacaoVigente && isTruthy(notificacao.registrar_changelog) && session.currentTenantId === 'agileecommerce') {
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
