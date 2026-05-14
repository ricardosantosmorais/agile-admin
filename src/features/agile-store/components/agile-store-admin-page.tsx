'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign, RefreshCcw, RotateCcw, XCircle } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatCard } from '@/src/components/ui/stat-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { agileStoreClient } from '@/src/features/agile-store/services/agile-store-client'
import type {
  AgileStoreAdminCustomer,
  AgileStoreAdminDashboard,
  AgileStoreAdminEvent,
  AgileStoreAdminModuleMetric,
  AgileStoreAdminVisit,
} from '@/src/features/agile-store/types/agile-store'
import { useI18n } from '@/src/i18n/use-i18n'

type AdminFilters = {
  scope: 'periodo' | 'geral'
  start: string
  end: string
  moduleId: string
  billingStatus: string
}

type PendingAction =
  | {
      type: 'billing'
      customer: AgileStoreAdminCustomer
      status: AgileStoreAdminCustomer['expectedBillingStatus'] | 'pendente'
    }
  | {
      type: 'cancel'
      customer: AgileStoreAdminCustomer
    }

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultFilters(): AdminFilters {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 6)

  return {
    scope: 'periodo',
    start: toInputDate(start),
    end: toInputDate(today),
    moduleId: '',
    billingStatus: '',
  }
}

const numberFormatter = new Intl.NumberFormat('pt-BR')
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const moneyFormatter = new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' })

function formatNumber(value: number) {
  return numberFormatter.format(value || 0)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value || 0)}%`
}

function formatMoney(value: number) {
  return moneyFormatter.format(value || 0)
}

function parseDate(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value?: string | null) {
  const date = parseDate(value)
  if (!date) return value || '-'
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatDateTime(value?: string | null) {
  const date = parseDate(value)
  if (!date) return value || '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function contractStatusLabel(status: string) {
  return {
    ativo: 'Ativo',
    pendente_ativacao: 'Ativando',
    falha_ativacao: 'Falha na ativação',
    pendente_desativacao: 'Desativando',
    falha_desativacao: 'Falha na desativação',
    cancelado: 'Cancelado',
  }[status] ?? status ?? '-'
}

function billingStatusLabel(status: string) {
  return {
    pendente: 'Pendente',
    gratuidade: 'Gratuidade',
    faturado: 'Faturado',
    cancelado: 'Cancelado',
  }[status] ?? 'Pendente'
}

function eventLabel(action: string) {
  return {
    visualizar: 'Visualização',
    contratar: 'Contratação',
    descontratar: 'Descontratação',
    reprocessar: 'Reprocessamento',
    faturamento_pendente: 'Faturamento pendente',
    faturamento_faturado: 'Faturamento marcado',
    faturamento_cancelado: 'Fatura cancelada',
  }[action] ?? action ?? 'Movimento'
}

function conversionLabel(status: string) {
  return {
    convertido: 'Convertido',
    cancelado: 'Cancelado',
    visita: 'Visita',
  }[status] ?? status ?? 'Visita'
}

function contractTone(status: string) {
  if (status === 'ativo') return 'success' as const
  if (status.includes('falha')) return 'danger' as const
  if (status === 'cancelado') return 'neutral' as const
  return 'warning' as const
}

function billingTone(status: string) {
  if (status === 'faturado') return 'success' as const
  if (status === 'cancelado') return 'danger' as const
  if (status === 'gratuidade') return 'info' as const
  return 'warning' as const
}

function conversionTone(status: string) {
  if (status === 'convertido') return 'success' as const
  if (status === 'cancelado') return 'danger' as const
  return 'neutral' as const
}

function actionCopy(action: PendingAction | null) {
  if (!action) {
    return { title: '', description: '', confirmLabel: '', tone: 'default' as const }
  }

  if (action.type === 'cancel') {
    return {
      title: 'Confirmar descontratação?',
      description: 'O módulo será descontratado para este cliente e ficará pendente para marcar a fatura como cancelada.',
      confirmLabel: 'Sim, descontratar',
      tone: 'danger' as const,
    }
  }

  if (action.status === 'cancelado') {
    return {
      title: 'Confirmar cancelamento do faturamento?',
      description: 'O faturamento desta contratação será marcado como cancelado.',
      confirmLabel: 'Sim, cancelar faturamento',
      tone: 'danger' as const,
    }
  }

  if (action.status === 'pendente') {
    return {
      title: 'Confirmar pendência?',
      description: 'Esta contratação voltará para pendente de faturamento.',
      confirmLabel: 'Sim, marcar pendente',
      tone: 'default' as const,
    }
  }

  return {
    title: 'Confirmar faturamento?',
    description: 'Esta contratação será marcada como faturada.',
    confirmLabel: 'Sim, marcar faturado',
    tone: 'default' as const,
  }
}

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string | number
  payload?: Array<{ color?: string; name?: string; value?: number | string }>
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-line/80 bg-[color:var(--app-panel-solid)] px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-[color:var(--app-text)]">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex min-w-40 items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[color:var(--app-muted)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-[color:var(--app-text)]">{formatNumber(Number(item.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminTrendChart({ items }: { items: AgileStoreAdminDashboard['trend'] }) {
  if (!items.length) {
    return (
      <div
        data-testid="agile-store-admin-line-chart"
        className="flex h-72 items-center justify-center rounded-[1rem] border border-dashed border-line/80 text-sm text-[color:var(--app-muted)]"
      >
        Sem dados no período.
      </div>
    )
  }

  const rows = items.map((item) => ({
    label: item.label,
    visitas: item.visits,
    contratacoes: item.conversions,
    cancelamentos: item.cancellations,
  }))

  return (
    <div data-testid="agile-store-admin-line-chart" className="h-72 w-full min-w-0">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={rows} margin={{ bottom: 4, left: -18, right: 16, top: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
          <Legend iconType="circle" wrapperStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <Line activeDot={{ r: 5 }} dataKey="visitas" dot={false} name="Visitas" stroke="#2563eb" strokeWidth={2} type="monotone" />
          <Line activeDot={{ r: 5 }} dataKey="contratacoes" dot={false} name="Contratações" stroke="#0f766e" strokeWidth={2} type="monotone" />
          <Line activeDot={{ r: 5 }} dataKey="cancelamentos" dot={false} name="Cancelamentos" stroke="#f97316" strokeWidth={2} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AgileStoreAdminPage() {
  const { t } = useI18n()
  const [filters, setFilters] = useState<AdminFilters>(() => defaultFilters())
  const [data, setData] = useState<AgileStoreAdminDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const dashboard = await agileStoreClient.adminDashboard({
        escopo: filters.scope,
        inicio: filters.scope === 'periodo' ? filters.start : undefined,
        fim: filters.scope === 'periodo' ? filters.end : undefined,
        id_modulo: filters.moduleId || undefined,
        faturamento_status: filters.billingStatus || undefined,
      })
      setData(dashboard)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('agileStore.admin.errors.load', 'Não foi possível carregar a gestão da Agile Store.'))
    } finally {
      setIsLoading(false)
    }
  }, [filters.billingStatus, filters.end, filters.moduleId, filters.scope, filters.start, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const updateFilter = <T extends keyof AdminFilters>(key: T, value: AdminFilters[T]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters())
  }

  const runBillingAction = async (customer: AgileStoreAdminCustomer, status: AgileStoreAdminCustomer['expectedBillingStatus'] | 'pendente') => {
    setIsSubmitting(true)
    setError(null)
    try {
      await agileStoreClient.adminUpdateBillingStatus(customer.id, status)
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('agileStore.admin.errors.billing', 'Não foi possível atualizar o faturamento.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelContract = async (customer: AgileStoreAdminCustomer) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await agileStoreClient.adminCancelContract(customer.id)
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('agileStore.admin.errors.cancel', 'Não foi possível descontratar o módulo.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    if (pendingAction.type === 'billing') {
      await runBillingAction(pendingAction.customer, pendingAction.status)
    } else {
      await cancelContract(pendingAction.customer)
    }
    setPendingAction(null)
  }

  const moduleColumns = useMemo<Array<AppDataTableColumn<AgileStoreAdminModuleMetric>>>(
    () => [
      {
        id: 'module',
        header: 'Módulo',
        cell: (item) => (
          <div className="min-w-0">
            <p className="font-semibold text-[color:var(--app-text)]">{item.name}</p>
            <p className="text-xs text-[color:var(--app-muted)]">{item.type}</p>
          </div>
        ),
      },
      { id: 'visits', header: 'Visitas', tdClassName: 'text-right', cell: (item) => formatNumber(item.visits) },
      { id: 'contracts', header: 'Contratações', tdClassName: 'text-right', cell: (item) => formatNumber(item.periodContracts) },
      { id: 'cancellations', header: 'Cancelamentos', tdClassName: 'text-right', cell: (item) => formatNumber(item.periodCancellations) },
      { id: 'conversion', header: 'Conversão', tdClassName: 'text-right', cell: (item) => formatPercent(item.conversion) },
      { id: 'growth', header: 'Crescimento', tdClassName: 'text-right', cell: (item) => formatPercent(item.growth) },
    ],
    [],
  )

  const visitColumns = useMemo<Array<AppDataTableColumn<AgileStoreAdminVisit>>>(
    () => [
      {
        id: 'customer',
        header: 'Cliente',
        cell: (item) => (
          <div className="min-w-0">
            <p className="font-semibold text-[color:var(--app-text)]">{item.companyName}</p>
            <p className="text-xs text-[color:var(--app-muted)]">{item.companyDocument}</p>
          </div>
        ),
      },
      { id: 'module', header: 'Produto', cell: (item) => item.moduleName },
      { id: 'visitor', header: 'Visitante', cell: (item) => item.userName || item.userEmail || '-' },
      { id: 'visitedAt', header: 'Visita', cell: (item) => formatDateTime(item.visitedAt) },
      { id: 'event', header: 'Evento', cell: (item) => <StatusBadge tone={conversionTone(item.conversionStatus)}>{conversionLabel(item.conversionStatus)}</StatusBadge> },
    ],
    [],
  )

  const customerColumns = useMemo<Array<AppDataTableColumn<AgileStoreAdminCustomer>>>(
    () => [
      {
        id: 'customer',
        header: 'Cliente',
        cell: (item) => (
          <div className="min-w-0">
            <p className="font-semibold text-[color:var(--app-text)]">{item.companyName}</p>
            <p className="text-xs text-[color:var(--app-muted)]">{item.companyDocument}</p>
          </div>
        ),
      },
      { id: 'module', header: 'Produto', cell: (item) => item.moduleName },
      { id: 'status', header: 'Status', cell: (item) => <StatusBadge tone={contractTone(item.status)}>{contractStatusLabel(item.status)}</StatusBadge> },
      { id: 'value', header: 'Valor', tdClassName: 'text-right', cell: (item) => <strong className="text-[color:var(--app-text)]">{formatMoney(item.value)}</strong> },
      {
        id: 'trial',
        header: 'Gratuidade',
        tdClassName: 'text-right',
        cell: (item) => (
          <div>
            <span>{item.trialUntil ? formatDate(item.trialUntil) : '-'}</span>
            {item.trialDays ? <small className="block text-[color:var(--app-muted)]">{item.trialDays} dias</small> : null}
          </div>
        ),
      },
      {
        id: 'firstBilling',
        header: 'Primeira cobrança',
        tdClassName: 'text-right',
        cell: (item) => (
          <div>
            <span>{item.firstBillingAt ? formatDate(item.firstBillingAt) : '-'}</span>
            {item.billingDay ? <small className="block text-[color:var(--app-muted)]">Dia {item.billingDay}</small> : null}
          </div>
        ),
      },
      { id: 'billing', header: 'Faturamento', cell: (item) => <StatusBadge tone={billingTone(item.billingStatus)}>{billingStatusLabel(item.billingStatus)}</StatusBadge> },
      { id: 'contractedAt', header: 'Contratação', cell: (item) => <div>{formatDateTime(item.contractedAt)}<small className="block text-[color:var(--app-muted)]">{item.contractedBy || '-'}</small></div> },
      {
        id: 'actions',
        header: 'Ações',
        tdClassName: 'text-right',
        cell: (item) => {
          const expectedLabel = item.expectedBillingStatus === 'cancelado' ? 'Marcar faturamento cancelado' : 'Marcar faturado'

          return (
            <div className="flex flex-wrap justify-end gap-2">
              {item.billingStatus !== item.expectedBillingStatus ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-label={expectedLabel}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-[color:var(--app-panel-solid)] px-3 text-xs font-semibold text-[color:var(--app-text)] shadow-sm transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setPendingAction({ type: 'billing', customer: item, status: item.expectedBillingStatus })}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  {item.expectedBillingStatus === 'cancelado' ? 'Cancelado' : 'Marcar faturado'}
                </button>
              ) : null}

              {item.billingStatus !== 'pendente' && item.billingStatus !== 'gratuidade' ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-label="Marcar pendente"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-[color:var(--app-panel-solid)] px-3 text-xs font-semibold text-[color:var(--app-muted)] shadow-sm transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setPendingAction({ type: 'billing', customer: item, status: 'pendente' })}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Pendente
                </button>
              ) : null}

              {item.canCancelContract ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-label="Descontratar módulo"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setPendingAction({ type: 'cancel', customer: item })}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          )
        },
      },
    ],
    [isSubmitting],
  )

  const eventColumns = useMemo<Array<AppDataTableColumn<AgileStoreAdminEvent>>>(
    () => [
      { id: 'event', header: 'Movimento', cell: (item) => <strong className="text-[color:var(--app-text)]">{eventLabel(item.action)}</strong> },
      { id: 'module', header: 'Produto', cell: (item) => item.moduleName || '-' },
      { id: 'customer', header: 'Cliente', cell: (item) => item.companyName || '-' },
      { id: 'user', header: 'Usuário', cell: (item) => item.userName || '-' },
      { id: 'createdAt', header: 'Data', cell: (item) => formatDateTime(item.createdAt) },
      { id: 'ip', header: 'IP', cell: (item) => item.ip || '-' },
    ],
    [],
  )

  const pendingCopy = actionCopy(pendingAction)
  const moduleOptions = data?.moduleOptions ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { href: '/dashboard', label: t('routes.dashboard', 'Início') },
          { href: '/agile-store', label: t('agileStore.title', 'Agile Store') },
          { label: t('agileStore.admin.title', 'Gestão da Agile Store') },
        ]}
        actions={(
          <button type="button" disabled={isLoading} onClick={() => void loadData()} className="app-button-secondary inline-flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            {t('common.refresh', 'Atualizar')}
          </button>
        )}
      />

      <SectionCard
        title={t('agileStore.admin.title', 'Gestão da Agile Store')}
        description={t('agileStore.admin.description', 'Acompanhe visitas, conversões, contratações, faturamento e cancelamentos administrativos da loja.')}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px_220px_auto]">
          <label className="space-y-2 text-sm font-medium text-[color:var(--app-text)]">
            <span>Visão</span>
            <select className="app-input h-11" value={filters.scope} onChange={(event) => updateFilter('scope', event.target.value as AdminFilters['scope'])}>
              <option value="periodo">Período</option>
              <option value="geral">Geral</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-[color:var(--app-text)]">
            <span>Início</span>
            <input className="app-input h-11" disabled={filters.scope !== 'periodo'} type="date" value={filters.start} onChange={(event) => updateFilter('start', event.target.value)} />
          </label>

          <label className="space-y-2 text-sm font-medium text-[color:var(--app-text)]">
            <span>Fim</span>
            <input className="app-input h-11" disabled={filters.scope !== 'periodo'} type="date" value={filters.end} onChange={(event) => updateFilter('end', event.target.value)} />
          </label>

          <label className="space-y-2 text-sm font-medium text-[color:var(--app-text)]">
            <span>Produto</span>
            <select className="app-input h-11" value={filters.moduleId} onChange={(event) => updateFilter('moduleId', event.target.value)}>
              <option value="">Todos os produtos</option>
              {moduleOptions.map((module) => (
                <option key={module.id} value={module.id}>{module.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-[color:var(--app-text)]">
            <span>Faturamento</span>
            <select className="app-input h-11" value={filters.billingStatus} onChange={(event) => updateFilter('billingStatus', event.target.value)}>
              <option value="">Todos</option>
              <option value="gratuidade">Gratuidade</option>
              <option value="pendente">Pendente</option>
              <option value="faturado">Faturado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>

          <div className="flex items-end">
            <button type="button" className="app-button-secondary h-11 w-full" onClick={clearFilters}>
              Limpar
            </button>
          </div>
        </div>
      </SectionCard>

      <AsyncState
        isLoading={isLoading}
        error={error ?? undefined}
        loadingTitle="Carregando gestão da Agile Store"
        loadingDescription="Preparando indicadores, visitas e contratações dos módulos."
      >
        {data ? (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Visitas" value={data.summary.visits} variation={0} showComparison={false} tone="sky" description="Acessos aos módulos" />
              <StatCard label="Contratações" value={data.summary.periodContracts} variation={0} showComparison={false} tone="emerald" description="Contratações realizadas" />
              <StatCard label="Cancelamentos" value={data.summary.periodCancellations} variation={0} showComparison={false} tone="rose" description="Cancelamentos registrados" />
              <StatCard label="MRR contratado" value={data.summary.mrr} variation={0} showComparison={false} tone="amber" type="currency" description="Receita recorrente prevista" />
            </section>

            <SectionCard title={t('agileStore.admin.trendTitle', 'Visitas, contratações e cancelamentos')} description="Evolução diária de visitas, contratações e cancelamentos no período.">
              <AdminTrendChart items={data.trend} />
            </SectionCard>

            <SectionCard title={t('agileStore.admin.modulePerformance', 'Performance por módulo')} description="Leitura consolidada por módulo para identificar desempenho, conversão e queda.">
              <AppDataTable
                rows={data.modules}
                getRowId={(item) => item.id}
                columns={moduleColumns}
                emptyMessage="Nenhum módulo encontrado para os filtros atuais."
                mobileCard={{
                  title: (item) => item.name,
                  subtitle: (item) => item.type,
                  meta: (item) => `${formatNumber(item.visits)} visitas · ${formatPercent(item.conversion)} conversão`,
                }}
              />
            </SectionCard>

            <SectionCard title={t('agileStore.admin.visitsEvents', 'Visitas e eventos')} description="Últimas visitas e eventos registrados na vitrine da Agile Store.">
              <div
                data-testid="agile-store-admin-visits-table"
                className="[&_.app-table-shell]:max-h-[620px] [&_.app-table-shell]:overflow-auto [&_.app-table-shell_th]:sticky [&_.app-table-shell_th]:top-0 [&_.app-table-shell_th]:z-10 [&_.app-table-shell_th]:bg-[color:var(--app-panel-solid)]"
              >
                <AppDataTable
                  rows={data.visits}
                  getRowId={(item) => item.id}
                  columns={visitColumns}
                  emptyMessage="Nenhuma visita encontrada para os filtros atuais."
                  mobileCard={{
                    title: (item) => item.companyName,
                    subtitle: (item) => item.moduleName,
                    meta: (item) => formatDateTime(item.visitedAt),
                    badges: (item) => <StatusBadge tone={conversionTone(item.conversionStatus)}>{conversionLabel(item.conversionStatus)}</StatusBadge>,
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard title={t('agileStore.admin.contractsBilling', 'Contratações e faturamento')} description="Contratações, status operacional e marcações de faturamento.">
              <AppDataTable
                rows={data.customers}
                getRowId={(item) => item.id}
                columns={customerColumns}
                emptyMessage="Nenhuma contratação encontrada para os filtros atuais."
                mobileCard={{
                  title: (item) => item.companyName,
                  subtitle: (item) => item.moduleName,
                  meta: (item) => formatMoney(item.value),
                  badges: (item) => (
                    <>
                      <StatusBadge tone={contractTone(item.status)}>{contractStatusLabel(item.status)}</StatusBadge>
                      <StatusBadge tone={billingTone(item.billingStatus)}>{billingStatusLabel(item.billingStatus)}</StatusBadge>
                    </>
                  ),
                }}
              />
            </SectionCard>

            <SectionCard title={t('agileStore.admin.recentEvents', 'Eventos recentes')} description="Auditoria administrativa das últimas ações executadas nos módulos.">
              <AppDataTable
                rows={data.events}
                getRowId={(item) => item.id}
                columns={eventColumns}
                emptyMessage="Nenhum evento recente encontrado."
                mobileCard={{
                  title: (item) => eventLabel(item.action),
                  subtitle: (item) => item.moduleName || '-',
                  meta: (item) => `${item.companyName || '-'} · ${formatDateTime(item.createdAt)}`,
                }}
              />
            </SectionCard>
          </div>
        ) : null}
      </AsyncState>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingCopy.title}
        description={pendingCopy.description}
        confirmLabel={pendingCopy.confirmLabel}
        cancelLabel="Cancelar"
        tone={pendingCopy.tone}
        isLoading={isSubmitting}
        onClose={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
      />
    </div>
  )
}
