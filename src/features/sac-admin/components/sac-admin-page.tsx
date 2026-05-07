'use client'

import { RefreshCcw, Search, Send, TicketCheck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { getSacAdminPermissions, getSacStatusInfo } from '@/src/features/sac-admin/services/sac-admin-mappers'
import { sacAdminClient } from '@/src/features/sac-admin/services/sac-admin-client'
import type { SacAdminPermissions, SacArea, SacAreaResponsible, SacDashboard, SacLookupOption, SacModuleConfig, SacSubject, SacTicket, SacTicketAction, SacTicketDetail } from '@/src/features/sac-admin/types/sac-admin'
import { useI18n } from '@/src/i18n/use-i18n'

type SacAdminPageProps = {
  permissions?: SacAdminPermissions
}

const STATUS_FILTERS = [
  { value: 'pendentes_atuacao', labelKey: 'sacAdmin.filters.pending', fallback: 'Pendentes' },
  { value: 'abertos', labelKey: 'sacAdmin.filters.open', fallback: 'Abertos' },
  { value: 'fechados', labelKey: 'sacAdmin.filters.closed', fallback: 'Fechados' },
]

const ACTION_STATUS_OPTIONS = [
  { value: 'em_atendimento', labelKey: 'sacAdmin.statusOptions.inProgress', fallback: 'Em atendimento' },
  { value: 'aguardando_cliente', labelKey: 'sacAdmin.statusOptions.waitingCustomer', fallback: 'Aguardando cliente' },
  { value: 'solucao_proposta', labelKey: 'sacAdmin.statusOptions.solutionProposed', fallback: 'Solução proposta' },
  { value: 'resolvido_cliente', labelKey: 'sacAdmin.statusOptions.resolvedByCustomer', fallback: 'Resolvido pelo cliente' },
  { value: 'fechado_inatividade', labelKey: 'sacAdmin.statusOptions.closedByInactivity', fallback: 'Fechado por inatividade' },
  { value: 'reaberto', labelKey: 'sacAdmin.statusOptions.reopened', fallback: 'Reaberto' },
]

function formatDate(value: string) {
  if (!value) return '-'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function KpiCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-extrabold text-foreground">{value}</strong>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const info = getSacStatusInfo(status)
  const classes = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-sky-50 text-sky-700',
    muted: 'bg-slate-100 text-slate-600',
  }[info.tone]

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{info.label}</span>
}

function TicketDetailModal({
  detail,
  error,
  isLoading,
  onClose,
  onAction,
  onRespond,
  permissions,
  areas,
  subjects,
  users,
}: {
  detail: SacTicketDetail | null
  error: string
  isLoading: boolean
  onClose: () => void
  onAction: (action: SacTicketAction, payload: Record<string, unknown>) => Promise<void>
  onRespond: (message: string) => Promise<void>
  permissions: SacAdminPermissions
  areas: SacLookupOption[]
  subjects: SacLookupOption[]
  users: SacLookupOption[]
}) {
  const { t } = useI18n()
  const [message, setMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [statusValue, setStatusValue] = useState('em_atendimento')
  const [statusMessage, setStatusMessage] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [transferAreaId, setTransferAreaId] = useState('')
  const [transferSubjectId, setTransferSubjectId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const ticket = detail?.ticket

  async function submitResponse() {
    const normalized = message.trim()
    if (!normalized) return
    await onRespond(normalized)
    setMessage('')
  }

  async function submitAction(action: SacTicketAction, payload: Record<string, unknown>, afterSuccess: () => void) {
    if (!ticket) return
    await onAction(action, {
      ...payload,
      updated_at: ticket.updatedAt,
    })
    afterSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{t('sacAdmin.detailEyebrow', 'Chamado')}</p>
            <h2 className="text-xl font-extrabold text-slate-950">{ticket?.protocol ?? t('common.loading', 'Carregando...')}</h2>
            {ticket ? <p className="mt-1 text-sm text-slate-600">{ticket.title}</p> : null}
          </div>
          <button type="button" aria-label={t('common.close', 'Fechar')} onClick={onClose} className="rounded-full border border-line p-2 text-slate-500 hover:text-slate-950">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid max-h-[calc(92vh-76px)] gap-4 overflow-auto p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {isLoading ? <div className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">{t('common.loading', 'Carregando...')}</div> : null}
            {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
            {ticket ? (
              <div className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{ticket.customerName || t('sacAdmin.customerNotInformed', 'Cliente não informado')}</p>
                    <p className="text-xs text-muted">{ticket.areaName || '-'} / {ticket.subjectName || '-'}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                {ticket.description ? <p className="mt-3 text-sm leading-6 text-slate-700">{ticket.description}</p> : null}
              </div>
            ) : null}

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-950">{t('sacAdmin.timeline', 'Histórico')}</h3>
              {detail?.messages.map((item) => (
                <article key={item.id} className="rounded-lg border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-slate-950">{item.authorName || item.authorType}</strong>
                    <span className="text-xs text-muted">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.message}</p>
                </article>
              ))}
              {!isLoading && !detail?.messages.length ? <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">{t('sacAdmin.noMessages', 'Nenhuma mensagem registrada.')}</div> : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-line p-4">
              <h3 className="text-sm font-extrabold text-slate-950">{t('sacAdmin.ticketData', 'Dados do chamado')}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('sacAdmin.order', 'Pedido')}</dt><dd className="mt-1 text-slate-900">{ticket?.orderCode || '-'}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('sacAdmin.assignee', 'Responsável')}</dt><dd className="mt-1 text-slate-900">{ticket?.assigneeName || '-'}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('sacAdmin.lastInteraction', 'Última interação')}</dt><dd className="mt-1 text-slate-900">{formatDate(ticket?.lastInteractionAt ?? '')}</dd></div>
              </dl>
            </div>

            {permissions.canRespond ? (
              <div className="rounded-lg border border-line p-4">
                <label htmlFor="sac-response-message" className="text-sm font-extrabold text-slate-950">{t('sacAdmin.responseLabel', 'Resposta ao cliente')}</label>
                <textarea id="sac-response-message" value={message} onChange={(event) => setMessage(event.target.value)} className="app-control mt-3 min-h-32 w-full rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => void submitResponse()} disabled={!message.trim()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  <Send className="h-4 w-4" />
                  {t('sacAdmin.respond', 'Responder')}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {t('sacAdmin.readOnlyDetail', 'Você pode visualizar o chamado, mas não possui permissão para responder.')}
              </div>
            )}
            {permissions.canAddInternalNote ? (
              <div className="rounded-lg border border-line p-4">
                <label htmlFor="sac-internal-note" className="text-sm font-extrabold text-slate-950">{t('sacAdmin.internalNote', 'Nota interna')}</label>
                <textarea id="sac-internal-note" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} className="app-control mt-3 min-h-24 w-full rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => void submitAction('internal-note', { mensagem: internalNote.trim() }, () => setInternalNote(''))} disabled={!internalNote.trim()} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {t('sacAdmin.saveInternalNote', 'Salvar nota')}
                </button>
              </div>
            ) : null}

            {permissions.canChangeStatus ? (
              <div className="rounded-lg border border-line p-4">
                <label htmlFor="sac-status-value" className="text-sm font-extrabold text-slate-950">{t('sacAdmin.statusValue', 'Novo status')}</label>
                <select id="sac-status-value" value={statusValue} onChange={(event) => setStatusValue(event.target.value)} className="app-control mt-3 w-full rounded-lg px-3 py-2 text-sm">
                  {ACTION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{t(item.labelKey, item.fallback)}</option>)}
                </select>
                <label htmlFor="sac-status-message" className="mt-3 block text-sm font-extrabold text-slate-950">{t('sacAdmin.statusMessage', 'Mensagem de status')}</label>
                <textarea id="sac-status-message" value={statusMessage} onChange={(event) => setStatusMessage(event.target.value)} className="app-control mt-3 min-h-20 w-full rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => void submitAction('status', { status: statusValue, mensagem: statusMessage.trim() }, () => setStatusMessage(''))} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                  {t('sacAdmin.changeStatus', 'Alterar status')}
                </button>
              </div>
            ) : null}

            {permissions.canAssign ? (
              <div className="rounded-lg border border-line p-4">
                <label htmlFor="sac-assign-user" className="text-sm font-extrabold text-slate-950">{t('sacAdmin.assigneeField', 'Responsável')}</label>
                <select id="sac-assign-user" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className="app-control mt-3 w-full rounded-lg px-3 py-2 text-sm">
                  <option value="">{t('common.select', 'Selecione')}</option>
                  {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button type="button" onClick={() => void submitAction('assign', { id_usuario_responsavel: assigneeId }, () => setAssigneeId(''))} disabled={!assigneeId} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {t('sacAdmin.assign', 'Atribuir')}
                </button>
              </div>
            ) : null}

            {permissions.canTransfer ? (
              <div className="rounded-lg border border-line p-4">
                <label htmlFor="sac-transfer-area" className="text-sm font-extrabold text-slate-950">{t('sacAdmin.transferArea', 'Área de destino')}</label>
                <select id="sac-transfer-area" value={transferAreaId} onChange={(event) => setTransferAreaId(event.target.value)} className="app-control mt-3 w-full rounded-lg px-3 py-2 text-sm">
                  <option value="">{t('common.select', 'Selecione')}</option>
                  {areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <label htmlFor="sac-transfer-subject" className="mt-3 block text-sm font-extrabold text-slate-950">{t('sacAdmin.transferSubject', 'Assunto de destino')}</label>
                <select id="sac-transfer-subject" value={transferSubjectId} onChange={(event) => setTransferSubjectId(event.target.value)} className="app-control mt-3 w-full rounded-lg px-3 py-2 text-sm">
                  <option value="">{t('common.select', 'Selecione')}</option>
                  {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <label htmlFor="sac-transfer-reason" className="mt-3 block text-sm font-extrabold text-slate-950">{t('sacAdmin.transferReason', 'Motivo da transferência')}</label>
                <textarea id="sac-transfer-reason" value={transferReason} onChange={(event) => setTransferReason(event.target.value)} className="app-control mt-3 min-h-20 w-full rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => void submitAction('transfer', { id_sac_area: transferAreaId, id_sac_assunto: transferSubjectId, motivo: transferReason.trim() }, () => { setTransferAreaId(''); setTransferSubjectId(''); setTransferReason('') })} disabled={!transferAreaId || !transferSubjectId || !transferReason.trim()} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {t('sacAdmin.transfer', 'Transferir')}
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  )
}

export function SacAdminPage({ permissions: providedPermissions }: SacAdminPageProps) {
  const { t } = useI18n()
  const { session } = useAuth()
  const permissions = useMemo(() => providedPermissions ?? getSacAdminPermissions(session), [providedPermissions, session])
  const [dashboard, setDashboard] = useState<SacDashboard | null>(null)
  const [tickets, setTickets] = useState<SacTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('pendentes_atuacao')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<SacTicketDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [areas, setAreas] = useState<SacArea[]>([])
  const [subjects, setSubjects] = useState<SacSubject[]>([])
  const [users, setUsers] = useState<SacLookupOption[]>([])
  const [areaResponsibles, setAreaResponsibles] = useState<SacAreaResponsible[]>([])
  const [areaFilter, setAreaFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [moduleConfig, setModuleConfig] = useState<SacModuleConfig>({ active: false, contracted: false, allowedEmails: '', autoCloseDays: 7, reopenDays: 7 })
  const [settingsError, setSettingsError] = useState('')
  const [selectedConfigAreaId, setSelectedConfigAreaId] = useState('')
  const [areaName, setAreaName] = useState('')
  const [areaSlaHours, setAreaSlaHours] = useState('24')
  const [areaActive, setAreaActive] = useState(true)
  const [areaShowResponsible, setAreaShowResponsible] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjectActive, setSubjectActive] = useState(true)
  const [subjectAllowOrderLink, setSubjectAllowOrderLink] = useState(true)
  const [subjectRequireOrder, setSubjectRequireOrder] = useState(false)
  const [responsibleUserId, setResponsibleUserId] = useState('')
  const [responsibleActive, setResponsibleActive] = useState(true)

  const loadLookups = useCallback(async () => {
    try {
      const shouldLoadUsers = permissions.canListAll || permissions.canAssign || permissions.canConfigureAreas
      const [areaResult, subjectResult, userResult] = await Promise.all([
        sacAdminClient.areas(),
        sacAdminClient.subjects(areaFilter || undefined),
        shouldLoadUsers ? sacAdminClient.users() : Promise.resolve([]),
      ])
      setAreas(areaResult)
      setSubjects(subjectResult)
      setUsers(userResult)
    } catch {
      setAreas([])
      setSubjects([])
      setUsers([])
    }
  }, [areaFilter, permissions.canAssign, permissions.canConfigureAreas, permissions.canListAll])

  const loadData = useCallback(async () => {
    if (!permissions.canList && !permissions.canViewDashboard) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const responsibleFilter = permissions.canListAll ? assigneeFilter : session?.user.id
      const [dashboardResult, listResult] = await Promise.all([
        permissions.canViewDashboard ? sacAdminClient.dashboard({ id_usuario_responsavel: responsibleFilter }) : Promise.resolve(null),
        permissions.canList ? sacAdminClient.list({ status, cliente: search, protocolo: search, id_sac_area: areaFilter, id_sac_assunto: subjectFilter, id_usuario_responsavel: responsibleFilter }) : Promise.resolve(null),
      ])
      if (dashboardResult) setDashboard(dashboardResult)
      if (listResult) setTickets(listResult.items)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('sacAdmin.errors.load', 'Não foi possível carregar o SAC.'))
    } finally {
      setIsLoading(false)
    }
  }, [areaFilter, assigneeFilter, permissions.canList, permissions.canListAll, permissions.canViewDashboard, search, session?.user.id, status, subjectFilter, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [loadData])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (!permissions.canConfigureModule) return
    void sacAdminClient.moduleConfig()
      .then(setModuleConfig)
      .catch((reason) => setSettingsError(reason instanceof Error ? reason.message : t('sacAdmin.errors.settings', 'Não foi possível carregar as configurações do SAC.')))
  }, [permissions.canConfigureModule, t])

  useEffect(() => {
    if (selectedConfigAreaId || !areas.length) return
    const firstArea = areas[0]
    setSelectedConfigAreaId(firstArea.id)
    setAreaName(firstArea.name)
    setAreaSlaHours(String(firstArea.slaHours ?? 0))
    setAreaActive(firstArea.active)
    setAreaShowResponsible(firstArea.showResponsibleName)
  }, [areas, selectedConfigAreaId])

  useEffect(() => {
    if (!permissions.canConfigureAreas || !selectedConfigAreaId) {
      setAreaResponsibles([])
      return
    }
    void sacAdminClient.areaResponsibles(selectedConfigAreaId)
      .then(setAreaResponsibles)
      .catch(() => setAreaResponsibles([]))
  }, [permissions.canConfigureAreas, selectedConfigAreaId])

  function selectConfigArea(areaId: string) {
    setSelectedConfigAreaId(areaId)
    const area = areas.find((item) => item.id === areaId)
    setAreaName(area?.name ?? '')
    setAreaSlaHours(String(area?.slaHours ?? 24))
    setAreaActive(area?.active ?? true)
    setAreaShowResponsible(area?.showResponsibleName ?? false)
    setSubjectName('')
    setSubjectActive(true)
    setSubjectAllowOrderLink(true)
    setSubjectRequireOrder(false)
    setResponsibleUserId('')
    setResponsibleActive(true)
  }

  async function saveModuleConfig() {
    await sacAdminClient.saveConfig({
      ativo: moduleConfig.active ? 1 : 0,
      emails_permitidos: moduleConfig.allowedEmails,
      fechamento_automatico_dias: Number(moduleConfig.autoCloseDays),
      prazo_reabertura_dias: Number(moduleConfig.reopenDays),
    })
    setModuleConfig(await sacAdminClient.moduleConfig())
  }

  async function saveAreaSettings() {
    await sacAdminClient.saveArea({
      id: selectedConfigAreaId,
      nome: areaName.trim(),
      mostrar_nome_responsavel_cliente: areaShowResponsible ? 1 : 0,
      sla_horas: Number(areaSlaHours),
      ativo: areaActive ? 1 : 0,
    })
    await loadLookups()
  }

  async function saveSubjectSettings() {
    await sacAdminClient.saveSubject({
      id: '',
      id_sac_area: selectedConfigAreaId,
      nome: subjectName.trim(),
      permite_vinculo_pedido: subjectAllowOrderLink ? 1 : 0,
      obriga_pedido: subjectRequireOrder ? 1 : 0,
      ativo: subjectActive ? 1 : 0,
    })
    setSubjectName('')
    await loadLookups()
  }

  async function saveAreaResponsibleSettings() {
    await sacAdminClient.saveAreaResponsible(selectedConfigAreaId, {
      id: '',
      id_usuario: responsibleUserId,
      ativo: responsibleActive ? 1 : 0,
    })
    setResponsibleUserId('')
    setResponsibleActive(true)
    setAreaResponsibles(await sacAdminClient.areaResponsibles(selectedConfigAreaId))
  }

  async function openTicket(id: string) {
    if (!permissions.canView) return
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setIsDetailLoading(true)
    try {
      setDetail(await sacAdminClient.detail(id))
    } catch (reason) {
      setDetailError(reason instanceof Error ? reason.message : t('sacAdmin.errors.detail', 'Não foi possível carregar o chamado.'))
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function respondToTicket(message: string) {
    if (!detail?.ticket) return
    await sacAdminClient.action(detail.ticket.id, 'respond', {
      mensagem: message,
      status: 'aguardando_cliente',
      updated_at: detail.ticket.updatedAt,
    })
    setDetail(await sacAdminClient.detail(detail.ticket.id))
    void loadData()
  }

  async function runTicketAction(action: SacTicketAction, payload: Record<string, unknown>) {
    if (!detail?.ticket) return
    await sacAdminClient.action(detail.ticket.id, action, payload)
    setDetail(await sacAdminClient.detail(detail.ticket.id))
    void loadData()
  }

  if (!permissions.canList && !permissions.canViewDashboard && !permissions.canConfigureAreas && !permissions.canConfigureModule) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-extrabold text-foreground">SAC</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {t('sacAdmin.noAccess', 'Você não possui permissão para acessar o SAC.')}
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t('sacAdmin.eyebrow', 'Atendimento')}</p>
          <h1 className="text-3xl font-extrabold text-foreground">SAC</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{t('sacAdmin.description', 'Acompanhe o backlog, priorize chamados e responda clientes pelo fluxo administrativo do SAC.')}</p>
        </div>
        <button type="button" onClick={() => void loadData()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-bold text-foreground hover:bg-surface" disabled={isLoading}>
          <RefreshCcw className="h-4 w-4" />
          {t('common.refresh', 'Atualizar')}
        </button>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('sacAdmin.openedPeriod', 'Abertos no período')} value={dashboard?.summary.opened ?? 0} />
        <KpiCard label={t('sacAdmin.pendingAction', 'Pendentes de atuação')} value={dashboard?.summary.pendingAction ?? 0} />
        <KpiCard label={t('sacAdmin.backlog', 'Backlog atual')} value={dashboard?.summary.backlog ?? 0} />
        <KpiCard label={t('sacAdmin.firstResponseSla', 'SLA 1ª resposta')} value={`${dashboard?.summary.firstResponseSlaPercent ?? 0}%`} hint={`${dashboard?.summary.firstResponseMinutes ?? 0} min`} />
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`rounded-lg px-3 py-2 text-sm font-bold ${status === item.value ? 'bg-slate-950 text-white' : 'border border-line bg-white text-slate-600 hover:text-slate-950'}`}>
                {t(item.labelKey, item.fallback)}
              </button>
            ))}
          </div>
          <label className="app-control flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 lg:w-80">
            <Search className="h-4 w-4 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full border-0 bg-transparent text-sm outline-none" placeholder={t('sacAdmin.searchPlaceholder', 'Cliente ou protocolo')} />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            {t('sacAdmin.areaFilter', 'Área')}
            <select value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setSubjectFilter('') }} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground">
              <option value="">{t('common.all', 'Todos')}</option>
              {areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            {t('sacAdmin.subjectFilter', 'Assunto')}
            <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground">
              <option value="">{t('common.all', 'Todos')}</option>
              {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          {permissions.canListAll ? (
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              {t('sacAdmin.assigneeFilter', 'Responsável pelo chamado')}
              <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground">
                <option value="">{t('common.all', 'Todos')}</option>
                {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      {isLoading ? <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">{t('common.loading', 'Carregando...')}</div> : null}

      {permissions.canConfigureModule || permissions.canConfigureAreas ? (
        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          {permissions.canConfigureModule ? (
            <div className="rounded-lg border border-line bg-white p-4">
              <h2 className="text-base font-extrabold text-slate-950">{t('sacAdmin.settingsTitle', 'Configurações do SAC')}</h2>
              {settingsError ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{settingsError}</div> : null}
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <input type="checkbox" checked={moduleConfig.active} onChange={(event) => setModuleConfig((current) => ({ ...current, active: event.target.checked }))} />
                  {t('sacAdmin.moduleActive', 'Módulo ativo')}
                </label>
                <label className="block text-sm font-bold text-slate-900">
                  {t('sacAdmin.allowedEmails', 'E-mails permitidos')}
                  <textarea value={moduleConfig.allowedEmails} onChange={(event) => setModuleConfig((current) => ({ ...current, allowedEmails: event.target.value }))} className="app-control mt-2 min-h-24 w-full rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-bold text-slate-900">
                  {t('sacAdmin.autoCloseDays', 'Fechamento automático')}
                  <input type="number" min={0} value={moduleConfig.autoCloseDays} onChange={(event) => setModuleConfig((current) => ({ ...current, autoCloseDays: Number(event.target.value) }))} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-bold text-slate-900">
                  {t('sacAdmin.reopenDays', 'Prazo para reabertura')}
                  <input type="number" min={0} value={moduleConfig.reopenDays} onChange={(event) => setModuleConfig((current) => ({ ...current, reopenDays: Number(event.target.value) }))} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm" />
                </label>
                <button type="button" onClick={() => void saveModuleConfig()} className="inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                  {t('sacAdmin.saveSettings', 'Salvar configurações')}
                </button>
              </div>
            </div>
          ) : null}

          {permissions.canConfigureAreas ? (
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-extrabold text-slate-950">{t('sacAdmin.areaSettingsTitle', 'Áreas e assuntos')}</h2>
                <select value={selectedConfigAreaId} onChange={(event) => selectConfigArea(event.target.value)} className="app-control rounded-lg px-3 py-2 text-sm">
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="space-y-3 rounded-lg border border-line p-4">
                  <h3 className="text-sm font-extrabold text-slate-950">{t('sacAdmin.areaFormTitle', 'Área')}</h3>
                  <label className="block text-sm font-bold text-slate-900">
                    {t('sacAdmin.areaName', 'Nome da área')}
                    <input value={areaName} onChange={(event) => setAreaName(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="block text-sm font-bold text-slate-900">
                    {t('sacAdmin.areaSla', 'SLA da área')}
                    <input type="number" min={0} value={areaSlaHours} onChange={(event) => setAreaSlaHours(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <input type="checkbox" checked={areaShowResponsible} onChange={(event) => setAreaShowResponsible(event.target.checked)} />
                    {t('sacAdmin.showResponsibleName', 'Mostrar responsável ao cliente')}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <input type="checkbox" checked={areaActive} onChange={(event) => setAreaActive(event.target.checked)} />
                    {t('common.active', 'Ativo')}
                  </label>
                  <button type="button" onClick={() => void saveAreaSettings()} disabled={!areaName.trim()} className="inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {t('sacAdmin.saveArea', 'Salvar área')}
                  </button>
                </div>
                <div className="space-y-3 rounded-lg border border-line p-4">
                  <h3 className="text-sm font-extrabold text-slate-950">{t('sacAdmin.subjectFormTitle', 'Assunto')}</h3>
                  <label className="block text-sm font-bold text-slate-900">
                    {t('sacAdmin.subjectName', 'Nome do assunto')}
                    <input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <input type="checkbox" checked={subjectAllowOrderLink} onChange={(event) => setSubjectAllowOrderLink(event.target.checked)} />
                    {t('sacAdmin.allowOrderLink', 'Permite vínculo com pedido')}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <input type="checkbox" checked={subjectRequireOrder} onChange={(event) => setSubjectRequireOrder(event.target.checked)} />
                    {t('sacAdmin.requireOrder', 'Obriga pedido')}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <input type="checkbox" checked={subjectActive} onChange={(event) => setSubjectActive(event.target.checked)} />
                    {t('common.active', 'Ativo')}
                  </label>
                  <button type="button" onClick={() => void saveSubjectSettings()} disabled={!selectedConfigAreaId || !subjectName.trim()} className="inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {t('sacAdmin.saveSubject', 'Salvar assunto')}
                  </button>
                  <div className="space-y-2 pt-2">
                    {subjects.filter((subject) => subject.areaId === selectedConfigAreaId).map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
                        <span className="font-semibold text-slate-900">{subject.name}</span>
                        <span className="text-xs text-muted">{subject.active ? t('common.active', 'Ativo') : t('common.inactive', 'Inativo')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-line p-4">
                  <h3 className="text-sm font-extrabold text-slate-950">{t('sacAdmin.responsibleFormTitle', 'Responsável')}</h3>
                  <label className="block text-sm font-bold text-slate-900">
                    {t('sacAdmin.responsibleUser', 'Usuário responsável')}
                    <select value={responsibleUserId} onChange={(event) => setResponsibleUserId(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm">
                      <option value="">{t('common.select', 'Selecione')}</option>
                      {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <input type="checkbox" checked={responsibleActive} onChange={(event) => setResponsibleActive(event.target.checked)} />
                    {t('common.active', 'Ativo')}
                  </label>
                  <button type="button" onClick={() => void saveAreaResponsibleSettings()} disabled={!selectedConfigAreaId || !responsibleUserId} className="inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {t('sacAdmin.saveResponsible', 'Salvar responsável')}
                  </button>
                  <div className="space-y-2 pt-2">
                    {areaResponsibles.map((responsible) => (
                      <div key={responsible.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-900">{responsible.userName || responsible.userId}</p>
                        <p className="text-xs text-muted">{responsible.userEmail || (responsible.active ? t('common.active', 'Ativo') : t('common.inactive', 'Inativo'))}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-base font-extrabold text-slate-950">{t('sacAdmin.tickets', 'Chamados')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-surface text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3">{t('sacAdmin.protocol', 'Protocolo')}</th>
                <th className="px-4 py-3">{t('sacAdmin.customer', 'Cliente')}</th>
                <th className="px-4 py-3">{t('sacAdmin.status', 'Status')}</th>
                <th className="px-4 py-3">{t('sacAdmin.areaSubject', 'Área / assunto')}</th>
                <th className="px-4 py-3">{t('sacAdmin.lastInteraction', 'Última interação')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions', 'Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-surface/70">
                  <td className="px-4 py-3 font-bold text-slate-950">{ticket.protocol}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{ticket.customerName || '-'}</p>
                    <p className="text-xs text-muted">{ticket.title}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3 text-slate-700">{ticket.areaName || '-'} / {ticket.subjectName || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(ticket.lastInteractionAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" aria-label={`abrir ${ticket.protocol}`} onClick={() => void openTicket(ticket.id)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950" disabled={!permissions.canView}>
                      <TicketCheck className="h-4 w-4" />
                      {t('common.open', 'Abrir')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && !tickets.length ? <div className="px-4 py-8 text-center text-sm text-muted">{t('sacAdmin.empty', 'Nenhum chamado encontrado com os filtros atuais.')}</div> : null}
      </section>

      {selectedId ? (
        <TicketDetailModal
          detail={detail}
          error={detailError}
          isLoading={isDetailLoading}
          onClose={() => setSelectedId('')}
          onAction={runTicketAction}
          onRespond={respondToTicket}
          permissions={permissions}
          areas={areas}
          subjects={subjects}
          users={users}
        />
      ) : null}
    </main>
  )
}
