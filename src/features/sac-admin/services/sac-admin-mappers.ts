import type {
  SacAdminPermissions,
  SacArea,
  SacAreaResponsible,
  SacAttachment,
  SacDashboard,
  SacEvent,
  SacMessage,
  SacLookupOption,
  SacModuleConfig,
  SacRawDashboardResponse,
  SacRawTicket,
  SacRawTicketDetailResponse,
  SacRawTicketListResponse,
  SacStatus,
  SacSubject,
  SacTicket,
  SacTicketDetail,
  SacTicketListResponse,
} from '@/src/features/sac-admin/types/sac-admin'
import type { AuthSession } from '@/src/features/auth/types/auth'
import { getFeatureAccess } from '@/src/features/auth/services/permissions'
import { normalizeSearchValue } from '@/src/lib/text-normalization'

function text(value: unknown) {
  return String(value ?? '').trim()
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function array<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function chartPoint(item: Record<string, unknown>) {
  return {
    label: text(item.label),
    total: number(item.total),
  }
}

export function normalizeSacDashboard(response: SacRawDashboardResponse): SacDashboard {
  const data = response.data ?? {}
  const summary = object(data.resumo)
  const charts = data.graficos ?? {}
  const rankings = data.rankings ?? {}

  return {
    period: {
      start: text(data.periodo?.data_inicial),
      end: text(data.periodo?.data_final),
    },
    summary: {
      opened: number(summary.abertos_periodo),
      closed: number(summary.fechados_periodo),
      backlog: number(summary.backlog_atual),
      pendingAction: number(summary.pendentes_atuacao),
      firstResponseMinutes: number(summary.tempo_primeira_resposta_minutos),
      resolutionHours: number(summary.tempo_resolucao_horas),
      firstResponseSlaPercent: number(summary.sla_primeira_resposta_percentual),
      resolutionSlaPercent: number(summary.sla_resolucao_percentual),
      reopened: number(summary.reaberturas_periodo),
      closedByCustomer: number(summary.fechados_cliente),
      closedByInactivity: number(summary.fechados_inatividade),
    },
    charts: {
      evolution: array(charts.evolucao).map((item) => ({
        date: text(item.data),
        label: text(item.label),
        opened: number(item.abertos),
        closed: number(item.fechados),
      })),
      status: array(charts.status).map((item) => chartPoint(item as Record<string, unknown>)),
      areas: array(charts.areas).map((item) => chartPoint(item as Record<string, unknown>)),
    },
    rankings: {
      pending: array(rankings.atuacao).map((item) => ({
        id: text(item.id),
        protocol: text(item.protocolo),
        title: text(item.titulo),
        areaName: text(item.area),
        lastInteractionAt: text(item.ultima_interacao_em),
      })),
    },
  }
}

export function normalizeSacTicket(raw: SacRawTicket): SacTicket {
  return {
    id: text(raw.id),
    protocol: text(raw.protocolo),
    title: text(raw.titulo),
    status: text(raw.status) as SacStatus,
    description: text(raw.descricao),
    customerName: text(raw.cliente_nome),
    customerDocument: text(raw.cliente_documento),
    areaName: text(raw.area_nome),
    subjectName: text(raw.assunto_nome),
    orderCode: text(raw.pedido),
    assigneeName: text(raw.responsavel_nome),
    createdAt: text(raw.created_at),
    updatedAt: text(raw.updated_at),
    lastInteractionAt: text(raw.ultima_interacao_em),
    canReopen: boolean(raw.pode_reabrir),
    reopenUntil: text(raw.prazo_reabertura_ate),
  }
}

export function normalizeSacTicketListResponse(response: SacRawTicketListResponse): SacTicketListResponse {
  const items = array(response.data).map(normalizeSacTicket)
  const meta = response.meta ?? {}
  const page = number(meta.page, 1)
  const perPage = number(meta.perpage ?? meta.perPage, 15)
  const total = number(meta.total, items.length)
  return {
    items,
    meta: {
      page,
      perPage,
      total,
      pages: number(meta.pages, Math.max(Math.ceil(total / Math.max(perPage, 1)), 1)),
    },
  }
}

function normalizeAttachment(raw: Record<string, unknown>): SacAttachment {
  return {
    id: text(raw.id),
    name: text(raw.nome_arquivo_original),
    url: text(raw.arquivo_url),
  }
}

function normalizeMessage(raw: Record<string, unknown>): SacMessage {
  return {
    id: text(raw.id),
    authorType: text(raw.autor_tipo),
    authorName: text(raw.autor_nome || raw.autor_nome_exibicao),
    message: text(raw.mensagem),
    createdAt: text(raw.created_at),
    attachments: array(raw.anexos as Array<Record<string, unknown>> | null | undefined).map(normalizeAttachment),
  }
}

function normalizeEvent(raw: Record<string, unknown>): SacEvent {
  return {
    id: text(raw.id),
    type: text(raw.tipo_evento),
    description: text(raw.descricao),
    createdAt: text(raw.created_at),
  }
}

export function normalizeSacTicketDetail(response: SacRawTicketDetailResponse): SacTicketDetail {
  const data = response.data ?? {}
  return {
    ticket: normalizeSacTicket(data.chamado ?? {}),
    messages: array(data.mensagens).map(normalizeMessage),
    events: array(data.eventos).map(normalizeEvent),
    items: array(data.itens).map((item) => ({
      id: text(item.id),
      sku: text(item.sku),
      productName: text(item.nome_produto),
      quantity: number(item.quantidade),
    })),
    attachments: array(data.anexos).map(normalizeAttachment),
  }
}

export function getSacStatusInfo(status: SacStatus) {
  const normalized = text(status)
  const map: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
    novo: { label: 'Novo', tone: 'info' },
    em_atendimento: { label: 'Em atendimento', tone: 'info' },
    aguardando_cliente: { label: 'Aguardando cliente', tone: 'warning' },
    solucao_proposta: { label: 'Solução proposta', tone: 'warning' },
    resolvido_cliente: { label: 'Resolvido pelo cliente', tone: 'success' },
    fechado_inatividade: { label: 'Fechado por inatividade', tone: 'muted' },
    reaberto: { label: 'Reaberto', tone: 'danger' },
    pendentes_atuacao: { label: 'Pendentes de atuação', tone: 'warning' },
    abertos: { label: 'Abertos', tone: 'info' },
    fechados: { label: 'Fechados', tone: 'success' },
  }
  return map[normalized] ?? { label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Não informado', tone: 'muted' }
}

export function normalizeSacLookupOptions(response: { data?: Array<Record<string, unknown>> | null }): SacLookupOption[] {
  return array(response.data)
    .map((item) => ({
      id: text(item.id),
      name: text(item.nome || item.name),
      active: item.ativo === undefined ? true : boolean(item.ativo),
    }))
    .filter((item) => item.id && item.name)
}

export function normalizeSacModuleConfig(response: { data?: Record<string, unknown> | null }): SacModuleConfig {
  const data = object(response.data)
  return {
    active: boolean(data.ativo),
    contracted: boolean(data.contratado),
    allowedEmails: text(data.emails_permitidos_texto || array(data.emails_permitidos as string[] | null | undefined).join('\n')),
    autoCloseDays: number(data.fechamento_automatico_dias, 7),
    reopenDays: number(data.prazo_reabertura_dias, 7),
  }
}

export function normalizeSacAreas(response: { data?: Array<Record<string, unknown>> | null }): SacArea[] {
  return array(response.data)
    .map((item) => ({
      id: text(item.id),
      name: text(item.nome || item.name),
      active: item.ativo === undefined ? true : boolean(item.ativo),
      showResponsibleName: boolean(item.mostrar_nome_responsavel_cliente),
      slaHours: number(item.sla_horas),
      totalTickets: number(item.total_chamados),
    }))
    .filter((item) => item.id && item.name)
}

export function normalizeSacSubjects(response: { data?: Array<Record<string, unknown>> | null }): SacSubject[] {
  return array(response.data)
    .map((item) => ({
      id: text(item.id),
      areaId: text(item.id_sac_area),
      name: text(item.nome || item.name),
      active: item.ativo === undefined ? true : boolean(item.ativo),
      allowOrderLink: boolean(item.permite_vinculo_pedido),
      requireOrder: boolean(item.obriga_pedido),
      totalTickets: number(item.total_chamados),
    }))
    .filter((item) => item.id && item.name)
}

export function normalizeSacAreaResponsibles(response: { data?: Array<Record<string, unknown>> | null }): SacAreaResponsible[] {
  return array(response.data)
    .map((item) => ({
      id: text(item.id),
      areaId: text(item.id_sac_area),
      userId: text(item.id_usuario),
      userName: text(item.usuario_nome),
      userEmail: text(item.usuario_email),
      active: item.ativo === undefined ? true : boolean(item.ativo),
    }))
    .filter((item) => item.id && item.userId)
}

function hasSacPermission(session: AuthSession | null, code: string) {
  if (!session || session.user.master) return true
  const normalizedCode = normalizeSearchValue(code)
  const upperCode = code.toUpperCase()
  return session.user.funcionalidades.some((permission) => {
    if (permission.ativo === false) return false
    const searchable = [
      permission.id,
      permission.nome,
      permission.chave,
      permission.slug,
      permission.componente,
      permission.acao ?? '',
      permission.url ?? '',
      permission.clique ?? '',
    ].join(' ')
    return searchable.toUpperCase().includes(upperCode) || normalizeSearchValue(searchable).includes(normalizedCode)
  })
}

export function getSacAdminPermissions(session: AuthSession | null): SacAdminPermissions {
  const access = getFeatureAccess(session, 'sac')
  return {
    canViewDashboard: access.canOpen || access.canView || hasSacPermission(session, 'SAC_DASHBOARD'),
    canList: access.canList || access.canOpen || hasSacPermission(session, 'SAC_FUNC_LISTAR_PROPRIOS') || hasSacPermission(session, 'SAC_FUNC_LISTAR_TODOS'),
    canListAll: hasSacPermission(session, 'SAC_FUNC_LISTAR_TODOS'),
    canView: access.canView || access.canList || access.canOpen || hasSacPermission(session, 'SAC_FUNC_VISUALIZAR'),
    canRespond: hasSacPermission(session, 'SAC_FUNC_RESPONDER'),
    canAddInternalNote: hasSacPermission(session, 'SAC_FUNC_NOTA_INTERNA'),
    canChangeStatus: hasSacPermission(session, 'SAC_FUNC_ALTERAR_STATUS'),
    canAssign: hasSacPermission(session, 'SAC_FUNC_ATRIBUIR_RESPONSAVEL'),
    canTransfer: hasSacPermission(session, 'SAC_FUNC_TRANSFERIR'),
    canConfigureAreas: hasSacPermission(session, 'SAC_FUNC_CONFIGURAR_AREAS'),
    canConfigureModule: hasSacPermission(session, 'SAC_FUNC_CONFIGURAR_MODULO'),
  }
}
