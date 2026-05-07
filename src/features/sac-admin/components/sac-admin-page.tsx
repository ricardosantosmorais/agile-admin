'use client'

import { RefreshCcw, Search, Send, TicketCheck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { getSacAdminPermissions, getSacStatusInfo } from '@/src/features/sac-admin/services/sac-admin-mappers'
import { sacAdminClient } from '@/src/features/sac-admin/services/sac-admin-client'
import type { SacAdminPermissions, SacDashboard, SacTicket, SacTicketDetail } from '@/src/features/sac-admin/types/sac-admin'
import { useI18n } from '@/src/i18n/use-i18n'

type SacAdminPageProps = {
  permissions?: SacAdminPermissions
}

const STATUS_FILTERS = [
  { value: 'pendentes_atuacao', labelKey: 'sacAdmin.filters.pending', fallback: 'Pendentes' },
  { value: 'abertos', labelKey: 'sacAdmin.filters.open', fallback: 'Abertos' },
  { value: 'fechados', labelKey: 'sacAdmin.filters.closed', fallback: 'Fechados' },
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
  onRespond,
  permissions,
}: {
  detail: SacTicketDetail | null
  error: string
  isLoading: boolean
  onClose: () => void
  onRespond: (message: string) => Promise<void>
  permissions: SacAdminPermissions
}) {
  const { t } = useI18n()
  const [message, setMessage] = useState('')
  const ticket = detail?.ticket

  async function submitResponse() {
    const normalized = message.trim()
    if (!normalized) return
    await onRespond(normalized)
    setMessage('')
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

  const loadData = useCallback(async () => {
    if (!permissions.canList && !permissions.canViewDashboard) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const [dashboardResult, listResult] = await Promise.all([
        permissions.canViewDashboard ? sacAdminClient.dashboard({}) : Promise.resolve(null),
        permissions.canList ? sacAdminClient.list({ status, cliente: search, protocolo: search }) : Promise.resolve(null),
      ])
      if (dashboardResult) setDashboard(dashboardResult)
      if (listResult) setTickets(listResult.items)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('sacAdmin.errors.load', 'Não foi possível carregar o SAC.'))
    } finally {
      setIsLoading(false)
    }
  }, [permissions.canList, permissions.canViewDashboard, search, status, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [loadData])

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

  if (!permissions.canList && !permissions.canViewDashboard) {
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
      </section>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      {isLoading ? <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">{t('common.loading', 'Carregando...')}</div> : null}

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
          onRespond={respondToTicket}
          permissions={permissions}
        />
      ) : null}
    </main>
  )
}
