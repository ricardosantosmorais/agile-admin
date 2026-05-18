'use client'

import { Clock3, Eye, Paperclip, RefreshCcw, Save, Send, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ModuleContractWarning } from '@/src/components/ui/module-contract-warning'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatCard } from '@/src/components/ui/stat-card'
import { StatusBadge as AppStatusBadge } from '@/src/components/ui/status-badge'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { getSacAdminPermissions, getSacStatusInfo } from '@/src/features/sac-admin/services/sac-admin-mappers'
import { sacAdminClient } from '@/src/features/sac-admin/services/sac-admin-client'
import type { SacAdminPermissions, SacArea, SacAreaResponsible, SacDashboard, SacLookupOption, SacModuleConfig, SacSubject, SacTicket, SacTicketAction, SacTicketDetail } from '@/src/features/sac-admin/types/sac-admin'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatNumber } from '@/src/lib/formatters'

type SacAdminPageProps = {
  permissions?: SacAdminPermissions
  view?: SacAdminView
}

type SacAdminView = 'dashboard' | 'tickets' | 'areas-subjects' | 'settings'

const STATUS_FILTERS = [
  { value: 'pendentes_atuacao', labelKey: 'sacAdmin.filters.pendingAction', fallback: 'Pendentes de atuação' },
  { value: 'abertos', labelKey: 'sacAdmin.filters.open', fallback: 'Abertos' },
  { value: 'aguardando_cliente', labelKey: 'sacAdmin.statusOptions.waitingCustomer', fallback: 'Aguardando cliente' },
  { value: 'em_atendimento', labelKey: 'sacAdmin.statusOptions.inProgress', fallback: 'Em atendimento' },
  { value: 'fechado_inatividade', labelKey: 'sacAdmin.statusOptions.closedByInactivity', fallback: 'Fechado por inatividade' },
  { value: 'fechados', labelKey: 'sacAdmin.filters.closedPlural', fallback: 'Fechados' },
  { value: 'novo', labelKey: 'sacAdmin.statusOptions.new', fallback: 'Novo' },
  { value: 'reaberto', labelKey: 'sacAdmin.statusOptions.reopened', fallback: 'Reaberto' },
  { value: 'resolvido_cliente', labelKey: 'sacAdmin.statusOptions.resolvedByCustomer', fallback: 'Resolvido pelo cliente' },
  { value: 'solucao_proposta', labelKey: 'sacAdmin.statusOptions.solutionProposed', fallback: 'Solução proposta' },
]

const ACTION_STATUS_OPTIONS = [
  { value: 'em_atendimento', labelKey: 'sacAdmin.statusOptions.inProgress', fallback: 'Em atendimento' },
  { value: 'aguardando_cliente', labelKey: 'sacAdmin.statusOptions.waitingCustomer', fallback: 'Aguardando cliente' },
  { value: 'solucao_proposta', labelKey: 'sacAdmin.statusOptions.solutionProposed', fallback: 'Solução proposta' },
  { value: 'resolvido_cliente', labelKey: 'sacAdmin.statusOptions.resolvedByCustomer', fallback: 'Resolvido pelo cliente' },
  { value: 'fechado_inatividade', labelKey: 'sacAdmin.statusOptions.closedByInactivity', fallback: 'Fechado por inatividade' },
  { value: 'reaberto', labelKey: 'sacAdmin.statusOptions.reopened', fallback: 'Reaberto' },
]

type SacListFilters = {
  status: string
  customer: string
  protocol: string
  startDate: string
  endDate: string
  areaFilter: string
  subjectFilter: string
  assigneeFilter: string
}

const defaultFilters: SacListFilters = {
  status: 'pendentes_atuacao',
  customer: '',
  protocol: '',
  startDate: '',
  endDate: '',
  areaFilter: '',
  subjectFilter: '',
  assigneeFilter: '',
}

const DEFAULT_MODULE_CONFIG: SacModuleConfig = {
  active: false,
  contracted: true,
  allowedEmails: '',
  autoCloseDays: 7,
  reopenDays: 7,
}

function formatDate(value: string) {
  if (!value) return '-'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function MetricTile({
  label,
  value,
  helper,
  tone = 'slate',
}: {
  label: string
  value: string
  helper: string
  tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'rose'
}) {
  const toneMap = {
    slate: 'app-pane-muted border-line/70',
    emerald: 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-400/35 dark:bg-emerald-500/12',
    sky: 'border-sky-200/80 bg-sky-50/70 dark:border-sky-400/35 dark:bg-sky-500/12',
    amber: 'border-amber-200/80 bg-amber-50/70 dark:border-amber-400/35 dark:bg-amber-500/12',
    rose: 'border-rose-200/80 bg-rose-50/70 dark:border-rose-400/35 dark:bg-rose-500/12',
  }

  return (
    <div className={`rounded-[1.1rem] border px-4 py-4 ${toneMap[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--app-muted)]">{label}</p>
      <strong className="mt-2 block text-2xl font-black tracking-tight text-[color:var(--app-text)]">{value}</strong>
      <span className="mt-2 block text-[11px] leading-4 text-[color:var(--app-muted)]">{helper}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const info = getSacStatusInfo(status)
  const toneMap = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    muted: 'neutral',
  } as const

  return <AppStatusBadge tone={toneMap[info.tone]}>{info.label}</AppStatusBadge>
}

function parseChartNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: unknown; color?: string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="app-card-modern rounded-[1rem] px-3 py-2.5 text-[12px] shadow-xl">
      {label !== undefined ? <div className="mb-1 font-semibold text-[color:var(--app-text)]">{label}</div> : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`${entry.name ?? 'value'}-${index}`} className="flex items-center gap-2 text-[color:var(--app-muted)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? '#195f4d' }} aria-hidden="true" />
            <span className="font-medium text-[color:var(--app-text)]">{entry.name ?? 'value'}:</span>
            <span>{formatNumber(parseChartNumber(entry.value))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartEmptyState({ label }: { label: string }) {
  return <div className="app-pane-muted flex h-64 items-center justify-center rounded-[1rem] border border-dashed px-4 text-center text-sm text-slate-500">{label}</div>
}

function DashboardLineChart({
  closedLabel,
  emptyLabel,
  items,
  openedLabel,
}: {
  closedLabel: string
  emptyLabel: string
  items: SacDashboard['charts']['evolution']
  openedLabel: string
}) {
  if (!items.length) return <ChartEmptyState label={emptyLabel} />

  const rows = items.map((item) => ({
    label: item.label || item.date || '-',
    opened: item.opened,
    closed: item.closed,
  }))

  return (
    <div data-testid="sac-open-closed-line-chart" className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" />
          <YAxis tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" tickFormatter={(value) => formatNumber(Number(value))} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="opened" name={openedLabel} stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="closed" name={closedLabel} stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function DashboardBarChart({
  emptyLabel,
  items,
  testId,
}: {
  emptyLabel: string
  items: Array<{ label: string; total: number }>
  testId: string
}) {
  if (!items.length) return <ChartEmptyState label={emptyLabel} />

  return (
    <div data-testid={testId} className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" />
          <YAxis tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" tickFormatter={(value) => formatNumber(Number(value))} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="total" name="Total" fill="#195f4d" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SacContractBanner({ config }: { config: SacModuleConfig }) {
  const { t } = useI18n()
  if (config.contracted) return null

  return (
    <ModuleContractWarning
      title={t('sacAdmin.contractWarning', 'Atenção: O módulo SAC ainda não está contratado para sua loja.')}
      description={t('sacAdmin.contractWarningDescription', 'As telas ficam disponíveis para administração, mas a ativação no front depende da contratação do módulo.')}
      actionLabel={t('sacAdmin.contractInAgileStore', 'Contratar na Agile Store')}
      href="/agile-store/mod_sac"
    />
  )
}

function DashboardPointRows({
  emptyLabel,
  items,
}: {
  emptyLabel: string
  items: Array<{ label: string; total: number }>
}) {
  const max = Math.max(...items.map((item) => item.total), 1)

  if (!items.length) {
    return <div className="app-pane-muted rounded-[1rem] px-3 py-4 text-sm text-slate-500">{emptyLabel}</div>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label || 'empty'} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-slate-900">{item.label || '-'}</span>
            <span className="font-black text-slate-950">{formatNumber(item.total)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((item.total / max) * 100, 5)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardPendingRows({
  emptyLabel,
  items,
}: {
  emptyLabel: string
  items: SacDashboard['rankings']['pending']
}) {
  if (!items.length) {
    return <div className="app-pane-muted rounded-[1rem] px-3 py-4 text-sm text-slate-500">{emptyLabel}</div>
  }

  return (
    <div className="space-y-3">
      {items.map((ticket) => (
        <article key={ticket.id || `${ticket.title}-${ticket.lastInteractionAt}`} className="app-pane-muted rounded-[1rem] px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-sm font-bold text-slate-950">{ticket.title || '-'}</h3>
              <p className="mt-1 text-xs text-slate-500">{ticket.protocol || ticket.areaName || '-'}</p>
            </div>
            <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <p className="mt-2 text-xs text-slate-500">{formatDate(ticket.lastInteractionAt)}</p>
        </article>
      ))}
    </div>
  )
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
  onRespond: (message: string, files: File[]) => Promise<void>
  permissions: SacAdminPermissions
  areas: SacLookupOption[]
  subjects: SacLookupOption[]
  users: SacLookupOption[]
}) {
  const { t } = useI18n()
  const [message, setMessage] = useState('')
  const [responseFiles, setResponseFiles] = useState<File[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)
  const [internalNote, setInternalNote] = useState('')
  const [statusValue, setStatusValue] = useState('em_atendimento')
  const [statusMessage, setStatusMessage] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [transferAreaId, setTransferAreaId] = useState('')
  const [transferSubjectId, setTransferSubjectId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const ticket = detail?.ticket
  const canSubmitResponse = message.trim().length > 0 || responseFiles.length > 0

  async function submitResponse() {
    const normalized = message.trim()
    if (!normalized && responseFiles.length === 0) return
    await onRespond(normalized, responseFiles)
    setMessage('')
    setResponseFiles([])
    setFileInputKey((current) => current + 1)
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
                  {item.attachments.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.attachments.map((attachment) => (
                        attachment.url ? (
                          <a key={attachment.id || attachment.url || attachment.name} href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-950">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{attachment.name || attachment.url}</span>
                          </a>
                        ) : (
                          <span key={attachment.id || attachment.name} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-slate-500">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{attachment.name}</span>
                          </span>
                        )
                      ))}
                    </div>
                  ) : null}
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
                <label htmlFor="sac-response-files" className="mt-3 block text-sm font-extrabold text-slate-950">{t('sacAdmin.attachments', 'Anexos')}</label>
                <input
                  key={fileInputKey}
                  id="sac-response-files"
                  type="file"
                  multiple
                  accept=".doc,.docx,.odt,.jpg,.jpeg,.gif,.png,.pdf,.xls,.xlsx,.txt,.zip"
                  onChange={(event) => setResponseFiles(Array.from(event.target.files ?? []))}
                  className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm"
                />
                <p className="mt-2 text-xs text-muted">
                  {responseFiles.length > 0
                    ? t('sacAdmin.filesSelected', `${responseFiles.length} arquivo(s) selecionado(s).`).replace('{count}', String(responseFiles.length))
                    : t('sacAdmin.noFilesSelected', 'Nenhum arquivo selecionado.')}
                </p>
                <button type="button" onClick={() => void submitResponse()} disabled={!canSubmitResponse} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
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

export function SacAdminPage({ permissions: providedPermissions, view = 'dashboard' }: SacAdminPageProps) {
  const { t } = useI18n()
  const { session } = useAuth()
  const permissions = useMemo(() => providedPermissions ?? getSacAdminPermissions(session), [providedPermissions, session])
  const showDashboard = view === 'dashboard'
  const showTickets = view === 'tickets'
  const showAreasSettings = view === 'areas-subjects'
  const showModuleSettings = view === 'settings'
  const canAccessCurrentView = (showDashboard && permissions.canViewDashboard)
    || (showTickets && permissions.canList)
    || (showAreasSettings && permissions.canConfigureAreas)
    || (showModuleSettings && permissions.canConfigureModule)
  const [dashboard, setDashboard] = useState<SacDashboard | null>(null)
  const [tickets, setTickets] = useState<SacTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<SacListFilters>(defaultFilters)
  const [draftFilters, setDraftFilters] = useState<SacListFilters>(defaultFilters)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<SacTicketDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [areas, setAreas] = useState<SacArea[]>([])
  const [subjects, setSubjects] = useState<SacSubject[]>([])
  const [users, setUsers] = useState<SacLookupOption[]>([])
  const [areaResponsibles, setAreaResponsibles] = useState<SacAreaResponsible[]>([])
  const [moduleConfig, setModuleConfig] = useState<SacModuleConfig>(DEFAULT_MODULE_CONFIG)
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
    if (!showTickets && !showAreasSettings) {
      setAreas([])
      setSubjects([])
      setUsers([])
      return
    }
    try {
      const shouldLoadUsers = (showTickets && (permissions.canListAll || permissions.canAssign)) || showAreasSettings
      const [areaResult, subjectResult, userResult] = await Promise.all([
        sacAdminClient.areas(),
        sacAdminClient.subjects(filters.areaFilter || undefined),
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
  }, [filters.areaFilter, permissions.canAssign, permissions.canListAll, showAreasSettings, showTickets])

  const loadData = useCallback(async () => {
    if (!canAccessCurrentView || (!showDashboard && !showTickets)) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const responsibleFilter = permissions.canListAll ? filters.assigneeFilter : session?.user.id
      const [dashboardResult, listResult] = await Promise.all([
        showDashboard ? sacAdminClient.dashboard({ id_usuario_responsavel: responsibleFilter }) : Promise.resolve(null),
        showTickets ? sacAdminClient.list({
          status: filters.status,
          cliente: filters.customer,
          protocolo: filters.protocol,
          data_inicial: filters.startDate,
          data_final: filters.endDate,
          id_sac_area: filters.areaFilter,
          id_sac_assunto: filters.subjectFilter,
          id_usuario_responsavel: responsibleFilter,
        }) : Promise.resolve(null),
      ])
      if (dashboardResult) setDashboard(dashboardResult)
      if (listResult) setTickets(listResult.items)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('sacAdmin.errors.load', 'Não foi possível carregar o SAC.'))
    } finally {
      setIsLoading(false)
    }
  }, [canAccessCurrentView, filters, permissions.canListAll, session?.user.id, showDashboard, showTickets, t])

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
    if (!canAccessCurrentView) return
    void sacAdminClient.moduleConfig()
      .then(setModuleConfig)
      .catch((reason) => setSettingsError(reason instanceof Error ? reason.message : t('sacAdmin.errors.settings', 'Não foi possível carregar as configurações do SAC.')))
  }, [canAccessCurrentView, t])

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
    if (!showAreasSettings || !permissions.canConfigureAreas || !selectedConfigAreaId) {
      setAreaResponsibles([])
      return
    }
    void sacAdminClient.areaResponsibles(selectedConfigAreaId)
      .then(setAreaResponsibles)
      .catch(() => setAreaResponsibles([]))
  }, [permissions.canConfigureAreas, selectedConfigAreaId, showAreasSettings])

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

  const openTicket = useCallback(async (id: string) => {
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
  }, [permissions.canView, t])

  async function respondToTicket(message: string, files: File[]) {
    if (!detail?.ticket) return
    await sacAdminClient.respond(detail.ticket.id, {
      mensagem: message,
      status: 'aguardando_cliente',
      updated_at: detail.ticket.updatedAt,
    }, files)
    setDetail(await sacAdminClient.detail(detail.ticket.id))
    void loadData()
  }

  async function runTicketAction(action: SacTicketAction, payload: Record<string, unknown>) {
    if (!detail?.ticket) return
    await sacAdminClient.action(detail.ticket.id, action, payload)
    setDetail(await sacAdminClient.detail(detail.ticket.id))
    void loadData()
  }

  function patchDraftFilters<K extends keyof SacListFilters>(key: K, value: SacListFilters[K]) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'areaFilter' ? { subjectFilter: '' } : {}),
    }))
  }

  function applyFilters() {
    setFilters(draftFilters)
  }

  function clearFilters() {
    setDraftFilters(defaultFilters)
    setFilters(defaultFilters)
  }

  const ticketColumns = useMemo(
    () => [
      {
        id: 'protocol',
        label: t('sacAdmin.protocol', 'Protocolo'),
        thClassName: 'w-[170px]',
        tdClassName: 'w-[170px]',
        cell: (ticket: SacTicket) => (
          <div className="space-y-1">
            <div className="font-black text-slate-950">{ticket.protocol}</div>
            <div className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</div>
          </div>
        ),
      },
      {
        id: 'customer',
        label: t('sacAdmin.customer', 'Cliente'),
        thClassName: 'w-[280px]',
        tdClassName: 'w-[280px]',
        cell: (ticket: SacTicket) => (
          <div className="space-y-2">
            <div className="font-semibold text-slate-950">{ticket.customerName || '-'}</div>
            <div className="line-clamp-2 text-xs leading-5 text-slate-500">{ticket.title || '-'}</div>
            {ticket.orderCode ? <AppStatusBadge tone="neutral">{`${t('sacAdmin.order', 'Pedido')} ${ticket.orderCode}`}</AppStatusBadge> : null}
          </div>
        ),
      },
      {
        id: 'status',
        label: t('sacAdmin.status', 'Status'),
        cell: (ticket: SacTicket) => <StatusBadge status={ticket.status} />,
      },
      {
        id: 'areaSubject',
        label: t('sacAdmin.areaSubject', 'Área / assunto'),
        cell: (ticket: SacTicket) => (
          <div className="space-y-1">
            <div className="font-medium text-slate-900">{ticket.areaName || '-'}</div>
            <div className="text-xs text-slate-500">{ticket.subjectName || '-'}</div>
          </div>
        ),
      },
      {
        id: 'assignee',
        label: t('sacAdmin.assignee', 'Responsável'),
        visibility: 'lg',
        cell: (ticket: SacTicket) => <span>{ticket.assigneeName || '-'}</span>,
      },
      {
        id: 'lastInteraction',
        label: t('sacAdmin.lastInteraction', 'Última interação'),
        visibility: 'lg',
        cell: (ticket: SacTicket) => <span>{formatDate(ticket.lastInteractionAt)}</span>,
      },
      {
        id: 'actions',
        label: t('common.actions', 'Ações'),
        thClassName: 'w-[120px] text-center',
        tdClassName: 'w-[120px] text-center',
        cell: (ticket: SacTicket) => (
          <button
            type="button"
            aria-label={`abrir ${ticket.protocol}`}
            onClick={() => void openTicket(ticket.id)}
            disabled={!permissions.canView}
            className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ] satisfies AppDataTableColumn<SacTicket, SacListFilters>[],
    [openTicket, permissions.canView, t],
  )

  const filterColumns = useMemo(
    () => [
      {
        id: 'customer',
        label: t('sacAdmin.customer', 'Cliente'),
        cell: () => null,
        filter: {
          id: 'customer',
          label: t('sacAdmin.customer', 'Cliente'),
          kind: 'text',
          key: 'customer' as const,
          widthClassName: 'xl:col-span-2',
          placeholder: t('sacAdmin.customerFilterPlaceholder', 'Nome, código ou documento'),
        },
      },
      {
        id: 'protocolFilter',
        label: t('sacAdmin.protocol', 'Protocolo'),
        cell: () => null,
        filter: {
          id: 'protocol',
          label: t('sacAdmin.protocol', 'Protocolo'),
          kind: 'text',
          key: 'protocol' as const,
          placeholder: t('sacAdmin.protocolFilterPlaceholder', 'Parte do protocolo'),
        },
      },
      {
        id: 'statusFilter',
        label: t('sacAdmin.status', 'Status'),
        cell: () => null,
        filter: {
          id: 'status',
          label: t('sacAdmin.status', 'Status'),
          kind: 'select',
          key: 'status' as const,
          options: STATUS_FILTERS.map((item) => ({ value: item.value, label: t(item.labelKey, item.fallback) })),
        },
      },
      {
        id: 'areaFilter',
        label: t('sacAdmin.areaFilter', 'Área'),
        cell: () => null,
        filter: {
          id: 'areaFilter',
          label: t('sacAdmin.areaFilter', 'Área'),
          kind: 'select',
          key: 'areaFilter' as const,
          options: areas.map((area) => ({ value: area.id, label: area.name })),
        },
      },
      {
        id: 'subjectFilter',
        label: t('sacAdmin.subjectFilter', 'Assunto'),
        cell: () => null,
        filter: {
          id: 'subjectFilter',
          label: t('sacAdmin.subjectFilter', 'Assunto'),
          kind: 'select',
          key: 'subjectFilter' as const,
          options: subjects.map((subject) => ({ value: subject.id, label: subject.name })),
        },
      },
      ...(permissions.canListAll ? [{
        id: 'assigneeFilter',
        label: t('sacAdmin.assigneeFilter', 'Responsável pelo chamado'),
        cell: () => null,
        filter: {
          id: 'assigneeFilter',
          label: t('sacAdmin.assigneeFilter', 'Responsável pelo chamado'),
          kind: 'select',
          key: 'assigneeFilter' as const,
          options: users.map((user) => ({ value: user.id, label: user.name })),
        },
      } satisfies AppDataTableColumn<unknown, SacListFilters>] : []),
      {
        id: 'createdAtRange',
        label: t('sacAdmin.openingRange', 'Abertura'),
        cell: () => null,
        filter: {
          id: 'createdAtRange',
          label: t('sacAdmin.openingRange', 'Abertura'),
          kind: 'custom',
          widthClassName: 'xl:col-span-2',
          getSummary: (currentFilters) => currentFilters.startDate || currentFilters.endDate ? t('sacAdmin.openingRange', 'Abertura') : null,
          render: ({ draft, patchDraft }) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[color:var(--app-text)]">
                {t('sacAdmin.openingStart', 'Abertura inicial')}
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) => patchDraft('startDate', event.target.value)}
                  className="app-control mt-2 w-full rounded-[0.9rem] px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-[color:var(--app-text)]">
                {t('sacAdmin.openingEnd', 'Abertura final')}
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(event) => patchDraft('endDate', event.target.value)}
                  className="app-control mt-2 w-full rounded-[0.9rem] px-3 py-2.5 text-sm"
                />
              </label>
            </div>
          ),
        },
      },
    ] satisfies AppDataTableColumn<unknown, SacListFilters>[],
    [areas, permissions.canListAll, subjects, t, users],
  )

  const tablePagination = {
    from: tickets.length ? 1 : 0,
    to: tickets.length,
    total: tickets.length,
    page: 1,
    pages: 1,
    perPage: Math.max(tickets.length, 15),
  }

  const summary = dashboard?.summary
  const statusDistribution = dashboard?.charts.status ?? []
  const areaDistribution = dashboard?.charts.areas ?? []
  const subjectDistribution = dashboard?.charts.subjects ?? []
  const closingDistribution = dashboard?.charts.closings ?? []
  const backlogAgeDistribution = dashboard?.charts.backlogAge ?? []
  const responsibleDistribution = dashboard?.charts.responsibles ?? []
  const customerRanking = dashboard?.rankings.customers ?? []
  const pendingRanking = dashboard?.rankings.pending ?? []
  const dashboardEvolution = dashboard?.charts.evolution ?? []
  const emptyDashboardLabel = t('dashboardRoot.empty', 'Sem dados para este período.')
  const currentViewLabel = {
    dashboard: t('sacAdmin.menu.dashboard', 'Dashboard'),
    tickets: t('sacAdmin.menu.tickets', 'Chamados'),
    'areas-subjects': t('sacAdmin.menu.areasSubjects', 'Áreas/Assuntos'),
    settings: t('sacAdmin.menu.settings', 'Configurações'),
  }[view]

  if (!canAccessCurrentView) {
    return (
      <main className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
            { label: 'SAC', href: '/sac/dashboard' },
            { label: currentViewLabel },
          ]}
        />
        <SectionCard title={t('accessDenied.title', 'Acesso negado')} description={t('sacAdmin.noAccess', 'Você não possui permissão para acessar o SAC.')}>
          <div className="app-pane-muted rounded-[1rem] px-4 py-4 text-sm text-slate-600">
          {t('sacAdmin.noAccess', 'Você não possui permissão para acessar o SAC.')}
          </div>
        </SectionCard>
      </main>
    )
  }

  return (
    <main className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: 'SAC', href: '/sac/dashboard' },
          { label: currentViewLabel },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={() => void loadData()} />}
      />

      <SacContractBanner config={moduleConfig} />

      <AsyncState
        isLoading={isLoading && (showDashboard || showTickets)}
        error={error}
        loadingTitle={t('sacAdmin.loadingTitle', 'Carregando SAC')}
        loadingDescription={t('sacAdmin.loadingDescription', 'Preparando indicadores, filtros e fila de chamados.')}
        errorAction={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={() => void loadData()} />}
      >
        {showDashboard ? (
        <SectionCard
          title={t('sacAdmin.pulseTitle', 'Pulso do atendimento')}
          description={t('sacAdmin.pulseDescription', 'Leitura rápida da pressão operacional, SLA e ritmo de resolução do SAC.')}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('sacAdmin.openedPeriod', 'Abertos no período')} value={summary?.opened ?? 0} variation={0} showComparison={false} description={t('sacAdmin.openedPeriodHelper', 'Chamados criados dentro do período retornado pela API.')} tone="sky" />
            <StatCard label={t('sacAdmin.pendingAction', 'Pendentes de atuação')} value={summary?.pendingAction ?? 0} variation={0} showComparison={false} description={t('sacAdmin.pendingActionHelper', 'Chamados que precisam de ação do time interno.')} tone="amber" />
            <StatCard label={t('sacAdmin.backlog', 'Backlog atual')} value={summary?.backlog ?? 0} variation={0} showComparison={false} description={t('sacAdmin.backlogHelper', 'Volume em aberto neste momento.')} tone="emerald" />
            <StatCard label={t('sacAdmin.firstResponseSla', 'SLA 1ª resposta')} value={summary?.firstResponseSlaPercent ?? 0} variation={0} showComparison={false} type="percent" description={`${summary?.firstResponseMinutes ?? 0} min`} tone="rose" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MetricTile label={t('sacAdmin.resolutionSla', 'SLA resolução')} value={`${formatNumber(summary?.resolutionSlaPercent ?? 0)}%`} helper={t('sacAdmin.resolutionSlaHelper', 'Percentual resolvido dentro do prazo.')} tone="emerald" />
            <MetricTile label={t('sacAdmin.resolutionTime', 'Tempo de resolução')} value={`${formatNumber(summary?.resolutionHours ?? 0)}h`} helper={t('sacAdmin.resolutionTimeHelper', 'Tempo médio até resolução do chamado.')} tone="sky" />
            <MetricTile label={t('sacAdmin.reopened', 'Reaberturas')} value={formatNumber(summary?.reopened ?? 0)} helper={t('sacAdmin.reopenedHelper', 'Chamados reabertos no período.')} tone={(summary?.reopened ?? 0) > 0 ? 'amber' : 'slate'} />
          </div>
        </SectionCard>
        ) : null}

        {showDashboard ? (
          <>
            <SectionCard title={t('sacAdmin.openClosedTitle', 'Abertos x Fechados')} description={t('sacAdmin.openClosedDescription', 'Ritmo diário de entrada e encerramento de chamados no período.')}>
              <DashboardLineChart closedLabel={t('sacAdmin.closedPeriodShort', 'Fechados')} emptyLabel={emptyDashboardLabel} items={dashboardEvolution} openedLabel={t('sacAdmin.openedPeriodShort', 'Abertos')} />
            </SectionCard>

            <div className="grid items-start gap-4 xl:grid-cols-2">
              <SectionCard title={t('sacAdmin.statusBlockTitle', 'Status')} description={t('sacAdmin.statusBlockDescription', 'Distribuição atual dos chamados por status operacional.')}>
                <DashboardPointRows emptyLabel={emptyDashboardLabel} items={statusDistribution} />
              </SectionCard>
              <SectionCard title={t('sacAdmin.closingsBlockTitle', 'Fechamentos')} description={t('sacAdmin.closingsBlockDescription', 'Motivos e origens de fechamento retornados pela API.')}>
                <DashboardPointRows emptyLabel={emptyDashboardLabel} items={closingDistribution} />
              </SectionCard>
              <SectionCard title={t('sacAdmin.areaVolumeTitle', 'Volume por Área')} description={t('sacAdmin.areaVolumeDescription', 'Áreas com maior concentração de chamados.')}>
                <DashboardPointRows emptyLabel={emptyDashboardLabel} items={areaDistribution} />
              </SectionCard>
              <SectionCard title={t('sacAdmin.subjectVolumeTitle', 'Volume por Assunto')} description={t('sacAdmin.subjectVolumeDescription', 'Assuntos mais acionados pelos clientes.')}>
                <DashboardPointRows emptyLabel={emptyDashboardLabel} items={subjectDistribution} />
              </SectionCard>
              <SectionCard title={t('sacAdmin.attentionTitle', 'Pendentes Mais Antigos')} description={t('sacAdmin.attentionDescription', 'Chamados que precisam de acompanhamento pelo tempo de espera.')}>
                <DashboardPendingRows emptyLabel={t('sacAdmin.noAttentionTickets', 'Nenhum chamado crítico no momento.')} items={pendingRanking} />
              </SectionCard>
              <SectionCard title={t('sacAdmin.backlogAgeTitle', 'Backlog por Idade')} description={t('sacAdmin.backlogAgeDescription', 'Faixas de idade dos chamados ainda abertos.')}>
                <DashboardBarChart emptyLabel={emptyDashboardLabel} items={backlogAgeDistribution} testId="sac-backlog-age-bar-chart" />
              </SectionCard>
              <SectionCard title={t('sacAdmin.topCustomersTitle', 'Top Clientes')} description={t('sacAdmin.topCustomersDescription', 'Clientes com maior volume no período.')}>
                <DashboardPointRows emptyLabel={emptyDashboardLabel} items={customerRanking.map((item) => ({ label: item.name, total: item.total }))} />
              </SectionCard>
              <SectionCard title={t('sacAdmin.responsiblesTitle', 'Responsáveis')} description={t('sacAdmin.responsiblesDescription', 'Distribuição por responsável interno.')}>
                <DashboardPointRows emptyLabel={emptyDashboardLabel} items={responsibleDistribution} />
              </SectionCard>
            </div>
          </>
        ) : null}

        {showTickets ? (
        <SectionCard title={t('sacAdmin.queueTitle', 'Fila operacional')} description={t('sacAdmin.queueDescription', 'Chamados filtrados pelo status, cliente, protocolo, área, assunto e responsável permitido para o perfil.')} action={<div className="flex w-full items-center justify-start gap-3"><DataTableFilterToggleAction expanded={filtersExpanded} onClick={() => setFiltersExpanded((current) => !current)} collapsedLabel={t('filters.button', 'Filtros')} expandedLabel={t('filters.hide', 'Ocultar filtros')} hint="" /></div>}>
          <DataTableFiltersCard<SacListFilters> variant="embedded" columns={filterColumns} draft={draftFilters} applied={filters} expanded={filtersExpanded} onToggleExpanded={() => setFiltersExpanded((current) => !current)} onApply={applyFilters} onClear={clearFilters} patchDraft={patchDraftFilters} />
          <AppDataTable<SacTicket, string, SacListFilters>
            rows={tickets}
            getRowId={(ticket) => ticket.id}
            columns={ticketColumns}
            emptyMessage={t('sacAdmin.empty', 'Nenhum chamado encontrado com os filtros atuais.')}
            mobileCard={{ title: (ticket) => ticket.protocol, subtitle: (ticket) => ticket.customerName || '-', meta: (ticket) => ticket.title || '-', badges: (ticket) => <StatusBadge status={ticket.status} /> }}
            pagination={tablePagination}
            onPageChange={() => undefined}
          />
        </SectionCard>
        ) : null}
      </AsyncState>
      {showModuleSettings || showAreasSettings ? (
        <section className="space-y-4">
          {showModuleSettings && permissions.canConfigureModule ? (
            <SectionCard
              title={t('sacAdmin.settingsTitle', 'Configurações do SAC')}
              description={t('sacAdmin.settingsDescription', 'Parâmetros globais do módulo usados no atendimento do site e nas automações do SAC.')}
              action={(
                <button type="button" onClick={() => void saveModuleConfig()} className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                  <Save className="h-4 w-4" />
                  {t('sacAdmin.saveSettings', 'Salvar configurações')}
                </button>
              )}
            >
              {settingsError ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{settingsError}</div> : null}
              <div className="space-y-8">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{t('sacAdmin.moduleStatusTitle', 'Status do módulo')}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('sacAdmin.moduleStatusDescription', 'Controle se o SAC fica disponível para clientes no site.')}</p>
                  </div>
                  <div className="space-y-7">
                    <FormRow label={t('sacAdmin.moduleActive', 'Módulo ativo')} helperText={t('sacAdmin.moduleActiveHint', 'Quando inativo, o menu e as telas de SAC não ficam disponíveis para clientes na loja.')} contentClassName="max-w-[360px]">
                      <BooleanChoice value={moduleConfig.active} onChange={(value) => setModuleConfig((current) => ({ ...current, active: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
                    </FormRow>
                  </div>
                </section>

                <section className="space-y-4 border-t border-line/70 pt-7">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{t('sacAdmin.customerAccessTitle', 'Acesso do cliente')}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('sacAdmin.customerAccessDescription', 'Restrição opcional por e-mail para usuários do cliente no front.')}</p>
                  </div>
                  <div className="space-y-7">
                    <FormRow label={t('sacAdmin.allowedEmails', 'E-mails permitidos')} helperText={t('sacAdmin.allowedEmailsHint', 'Se preenchido, apenas esses e-mails de usuários do cliente poderão ver e acessar o SAC no front.')} contentClassName="max-w-[760px]">
                      <textarea aria-label={t('sacAdmin.allowedEmails', 'E-mails permitidos')} value={moduleConfig.allowedEmails} onChange={(event) => setModuleConfig((current) => ({ ...current, allowedEmails: event.target.value }))} className={`${inputClasses()} min-h-32 resize-y`} />
                    </FormRow>
                  </div>
                </section>

                <section className="space-y-4 border-t border-line/70 pt-7">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{t('sacAdmin.operationalDeadlinesTitle', 'Prazos operacionais')}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('sacAdmin.operationalDeadlinesDescription', 'Regras globais de encerramento automático e reabertura de chamados.')}</p>
                  </div>
                  <div className="space-y-7">
                    <FormRow label={t('sacAdmin.autoCloseDays', 'Fechamento automático')} helperText={t('sacAdmin.autoCloseDaysHint', 'Prazo global para fechar chamados por inatividade.')} contentClassName="max-w-[220px]">
                      <input aria-label={t('sacAdmin.autoCloseDays', 'Fechamento automático')} type="number" min={0} value={moduleConfig.autoCloseDays} onChange={(event) => setModuleConfig((current) => ({ ...current, autoCloseDays: Number(event.target.value) }))} className={inputClasses()} />
                    </FormRow>
                    <FormRow label={t('sacAdmin.reopenDays', 'Prazo para reabertura')} helperText={t('sacAdmin.reopenDaysHint', 'Prazo global para o cliente reabrir chamados fechados.')} contentClassName="max-w-[220px]">
                      <input aria-label={t('sacAdmin.reopenDays', 'Prazo para reabertura')} type="number" min={0} value={moduleConfig.reopenDays} onChange={(event) => setModuleConfig((current) => ({ ...current, reopenDays: Number(event.target.value) }))} className={inputClasses()} />
                    </FormRow>
                  </div>
                </section>
              </div>
            </SectionCard>
          ) : null}

          {showAreasSettings && permissions.canConfigureAreas ? (
            <SectionCard
              title={t('sacAdmin.areaSettingsTitle', 'Áreas e assuntos')}
              description={t('sacAdmin.areaSettingsDescription', 'Organize áreas, assuntos e responsáveis seguindo o mesmo cadastro operacional do legado.')}
              action={(
                <select aria-label={t('sacAdmin.areaFilter', 'Área')} value={selectedConfigAreaId} onChange={(event) => selectConfigArea(event.target.value)} className={`${inputClasses()} min-w-[240px]`}>
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
              )}
            >
              <div className="space-y-5">
                <section className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">{t('sacAdmin.areaDataTitle', 'Dados da área')}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('sacAdmin.areaDataDescription', 'Defina nome, SLA e visibilidade do responsável para esta área.')}</p>
                    </div>
                    <button type="button" onClick={() => void saveAreaSettings()} disabled={!areaName.trim()} className="app-button-primary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                      {t('sacAdmin.saveArea', 'Salvar área')}
                    </button>
                  </div>
                  <div className="space-y-7">
                    <FormRow label={t('sacAdmin.areaName', 'Nome da área')} contentClassName="max-w-[560px]" required>
                      <input aria-label={t('sacAdmin.areaName', 'Nome da área')} value={areaName} onChange={(event) => setAreaName(event.target.value)} className={inputClasses()} />
                    </FormRow>
                    <FormRow label={t('sacAdmin.areaSla', 'SLA da área')} contentClassName="max-w-[220px]">
                      <input aria-label={t('sacAdmin.areaSla', 'SLA da área')} type="number" min={0} value={areaSlaHours} onChange={(event) => setAreaSlaHours(event.target.value)} className={inputClasses()} />
                    </FormRow>
                    <FormRow label={t('sacAdmin.showResponsibleName', 'Mostrar responsável ao cliente')} contentClassName="max-w-[360px]">
                      <BooleanChoice value={areaShowResponsible} onChange={setAreaShowResponsible} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
                    </FormRow>
                    <FormRow label={t('common.active', 'Ativo')} contentClassName="max-w-[360px]">
                      <BooleanChoice value={areaActive} onChange={setAreaActive} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
                    </FormRow>
                  </div>
                </section>

                <section className="space-y-4 border-t border-line/70 pt-7">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">{t('sacAdmin.subjectRulesTitle', 'Regras do assunto')}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('sacAdmin.subjectRulesDescription', 'Cadastre assuntos vinculados à área e preserve as regras de pedido do legado.')}</p>
                    </div>
                    <button type="button" onClick={() => void saveSubjectSettings()} disabled={!selectedConfigAreaId || !subjectName.trim()} className="app-button-primary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                      {t('sacAdmin.saveSubject', 'Salvar assunto')}
                    </button>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-7">
                      <FormRow label={t('sacAdmin.subjectName', 'Nome do assunto')} contentClassName="max-w-[560px]" required>
                        <input aria-label={t('sacAdmin.subjectName', 'Nome do assunto')} value={subjectName} onChange={(event) => setSubjectName(event.target.value)} className={inputClasses()} />
                      </FormRow>
                      <FormRow label={t('sacAdmin.allowOrderLink', 'Permite vínculo com pedido')} contentClassName="max-w-[360px]">
                        <BooleanChoice
                          value={subjectAllowOrderLink}
                          onChange={(value) => {
                            setSubjectAllowOrderLink(value)
                            if (!value) setSubjectRequireOrder(false)
                          }}
                          trueLabel={t('common.yes', 'Sim')}
                          falseLabel={t('common.no', 'Não')}
                        />
                      </FormRow>
                      <FormRow label={t('sacAdmin.requireOrder', 'Obriga pedido')} contentClassName="max-w-[360px]">
                        <BooleanChoice
                          value={subjectRequireOrder}
                          onChange={(value) => {
                            setSubjectRequireOrder(value)
                            if (value) setSubjectAllowOrderLink(true)
                          }}
                          trueLabel={t('common.yes', 'Sim')}
                          falseLabel={t('common.no', 'Não')}
                        />
                      </FormRow>
                      <FormRow label={t('common.active', 'Ativo')} contentClassName="max-w-[360px]">
                        <BooleanChoice value={subjectActive} onChange={setSubjectActive} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
                      </FormRow>
                    </div>
                    <div className="app-pane-muted rounded-[1rem] p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sacAdmin.areaSubjectsTitle', 'Assuntos da área')}</p>
                      <div className="space-y-2">
                        {subjects.filter((subject) => subject.areaId === selectedConfigAreaId).map((subject) => (
                          <div key={subject.id} className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-surface px-3 py-2 text-sm">
                            <span className="font-semibold text-slate-900">{subject.name}</span>
                            <span className="text-xs text-muted">{subject.active ? t('common.active', 'Ativo') : t('common.inactive', 'Inativo')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-t border-line/70 pt-7">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">{t('sacAdmin.areaResponsibleTitle', 'Responsável pela área')}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('sacAdmin.areaResponsibleDescription', 'Associe usuários internos que podem atuar nos chamados desta área.')}</p>
                    </div>
                    <button type="button" onClick={() => void saveAreaResponsibleSettings()} disabled={!selectedConfigAreaId || !responsibleUserId} className="app-button-primary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                      {t('sacAdmin.saveResponsible', 'Salvar responsável')}
                    </button>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-7">
                      <FormRow label={t('sacAdmin.responsibleUser', 'Usuário responsável')} contentClassName="max-w-[560px]">
                        <select aria-label={t('sacAdmin.responsibleUser', 'Usuário responsável')} value={responsibleUserId} onChange={(event) => setResponsibleUserId(event.target.value)} className={inputClasses()}>
                          <option value="">{t('common.select', 'Selecione')}</option>
                          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                      </FormRow>
                      <FormRow label={t('common.active', 'Ativo')} contentClassName="max-w-[360px]">
                        <BooleanChoice value={responsibleActive} onChange={setResponsibleActive} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
                      </FormRow>
                    </div>
                    <div className="app-pane-muted rounded-[1rem] p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('sacAdmin.areaResponsiblesTitle', 'Responsáveis da área')}</p>
                      <div className="space-y-2">
                        {areaResponsibles.map((responsible) => (
                          <div key={responsible.id} className="rounded-[0.9rem] bg-surface px-3 py-2 text-sm">
                            <p className="font-semibold text-slate-900">{responsible.userName || responsible.userId}</p>
                            <p className="text-xs text-muted">{responsible.userEmail || (responsible.active ? t('common.active', 'Ativo') : t('common.inactive', 'Inativo'))}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </SectionCard>
          ) : null}
        </section>
      ) : null}

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
