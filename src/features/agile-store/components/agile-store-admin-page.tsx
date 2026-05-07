'use client'

import { BarChart3, RefreshCcw, Search, Store, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { agileStoreClient } from '@/src/features/agile-store/services/agile-store-client'
import type { AgileStoreAdminCustomer, AgileStoreAdminDashboard } from '@/src/features/agile-store/types/agile-store'
import { useI18n } from '@/src/i18n/use-i18n'

function todayInput(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function money(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value || 0)
}

function number(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value || 0)
}

function date(value: string) {
  if (!value) return '-'
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR').format(parsed)
}

function dateTime(value: string) {
  if (!value) return '-'
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
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

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      <strong className="mt-2 block text-2xl font-extrabold text-slate-950">{value}</strong>
      {hint ? <small className="mt-1 block text-xs text-muted">{hint}</small> : null}
    </div>
  )
}

function maxTrendValue(data: AgileStoreAdminDashboard | null) {
  return Math.max(1, ...(data?.trend ?? []).flatMap((item) => [item.visits, item.conversions, item.cancellations]))
}

export function AgileStoreAdminPage() {
  const { t } = useI18n()
  const [data, setData] = useState<AgileStoreAdminDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [scope, setScope] = useState<'periodo' | 'geral'>('periodo')
  const [start, setStart] = useState(() => todayInput(-6))
  const [end, setEnd] = useState(() => todayInput())
  const [moduleId, setModuleId] = useState('')
  const [billingStatus, setBillingStatus] = useState('')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setData(await agileStoreClient.adminDashboard({
        escopo: scope,
        inicio: scope === 'geral' ? '' : start,
        fim: scope === 'geral' ? '' : end,
        id_modulo: moduleId,
        faturamento_status: billingStatus,
        q: search,
      }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('agileStore.admin.errors.load', 'Não foi possível carregar a gestão da Agile Store.'))
    } finally {
      setIsLoading(false)
    }
  }, [billingStatus, end, moduleId, scope, search, start, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const moduleOptions = useMemo(() => data?.moduleOptions ?? [], [data])
  const trendMax = maxTrendValue(data)

  async function runBillingAction(customer: AgileStoreAdminCustomer, status: string) {
    setIsSubmitting(true)
    setError('')
    try {
      await agileStoreClient.adminUpdateBillingStatus(customer.id, status)
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('agileStore.admin.errors.billing', 'Não foi possível atualizar o faturamento.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function cancelContract(customer: AgileStoreAdminCustomer) {
    setIsSubmitting(true)
    setError('')
    try {
      await agileStoreClient.adminCancelContract(customer.id)
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('agileStore.admin.errors.cancel', 'Não foi possível descontratar o módulo.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function clearFilters() {
    setScope('periodo')
    setStart(todayInput(-6))
    setEnd(todayInput())
    setModuleId('')
    setBillingStatus('')
    setSearch('')
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t('agileStore.admin.eyebrow', 'Retaguarda')}</p>
          <h1 className="text-3xl font-extrabold text-foreground">{t('agileStore.admin.title', 'Gestão da Agile Store')}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{t('agileStore.admin.description', 'Acompanhe visitas, conversões, contratações, faturamento e cancelamentos administrativos da loja.')}</p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-bold text-foreground hover:bg-surface disabled:opacity-60">
          <RefreshCcw className="h-4 w-4" />
          {t('common.refresh', 'Atualizar')}
        </button>
      </header>

      <section className="grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-[170px_150px_150px_minmax(180px,1fr)_180px_minmax(180px,1fr)_120px]">
        <div className="app-control flex rounded-lg p-1">
          {[
            ['periodo', t('agileStore.admin.periodScope', 'Período')],
            ['geral', t('agileStore.admin.generalScope', 'Geral')],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setScope(value as 'periodo' | 'geral')} className={`flex-1 rounded-md px-3 py-2 text-xs font-bold ${scope === value ? 'bg-accent text-white' : 'text-muted hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          {t('agileStore.admin.start', 'Início')}
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} disabled={scope === 'geral'} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground" />
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          {t('agileStore.admin.end', 'Fim')}
          <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} disabled={scope === 'geral'} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground" />
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          {t('agileStore.admin.module', 'Produto')}
          <select value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground">
            <option value="">{t('agileStore.admin.allProducts', 'Todos os produtos')}</option>
            {moduleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          {t('agileStore.admin.billing', 'Faturamento')}
          <select value={billingStatus} onChange={(event) => setBillingStatus(event.target.value)} className="app-control mt-2 w-full rounded-lg px-3 py-2 text-sm normal-case tracking-normal text-foreground">
            <option value="">{t('common.all', 'Todos')}</option>
            <option value="gratuidade">Gratuidades</option>
            <option value="pendente">Pendentes</option>
            <option value="faturado">Faturados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </label>
        <label className="app-control mt-5 flex items-center gap-2 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full border-0 bg-transparent text-sm outline-none" placeholder={t('agileStore.admin.search', 'Cliente')} />
        </label>
        <button type="button" onClick={clearFilters} className="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-bold text-muted hover:text-foreground">
          {t('common.clear', 'Limpar')}
        </button>
      </section>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      {isLoading ? <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">{t('common.loading', 'Carregando...')}</div> : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('agileStore.admin.visits', 'Visitas')} value={number(data?.summary.visits ?? 0)} />
        <MetricCard label={t('agileStore.admin.contracts', 'Contratações')} value={number(data?.summary.activeContracts ?? 0)} hint={`${number(data?.summary.periodContracts ?? 0)} no período`} />
        <MetricCard label={t('agileStore.admin.mrr', 'MRR contratado')} value={money(data?.summary.mrr ?? 0)} />
        <MetricCard label={t('agileStore.admin.freeContracts', 'Gratuidades ativas')} value={number(data?.summary.freeContracts ?? 0)} hint={`${number(data?.summary.failures ?? 0)} falhas`} />
      </section>

      <section className="rounded-lg border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t('agileStore.admin.analysis', 'Análise')}</span>
            <h2 className="text-base font-extrabold text-slate-950">{t('agileStore.admin.trendTitle', 'Visitas, contratações e cancelamentos')}</h2>
          </div>
          <BarChart3 className="h-5 w-5 text-muted" />
        </div>
        <div className="space-y-3 p-4">
          {(data?.trend ?? []).map((item) => (
            <div key={item.label} className="grid gap-2 text-sm md:grid-cols-[90px_minmax(0,1fr)] md:items-center">
              <strong className="text-slate-700">{item.label}</strong>
              <div className="grid gap-1">
                {[
                  ['Visitas', item.visits, 'bg-sky-500'],
                  ['Contratações', item.conversions, 'bg-emerald-500'],
                  ['Cancelamentos', item.cancellations, 'bg-rose-500'],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="flex items-center gap-2">
                    <span className="w-28 text-xs font-semibold text-muted">{label}</span>
                    <span className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(4, (Number(value) / trendMax) * 100)}%` }} />
                    <span className="text-xs font-bold text-slate-700">{number(Number(value))}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!data?.trend.length ? <div className="rounded-lg border border-dashed border-line p-5 text-center text-sm text-muted">{t('agileStore.admin.emptyTrend', 'Sem movimentos no período.')}</div> : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t('agileStore.admin.performance', 'Performance')}</span>
            <h2 className="text-base font-extrabold text-slate-950">{t('agileStore.admin.modulePerformance', 'Performance por módulo')}</h2>
          </div>
          <Store className="h-5 w-5 text-muted" />
        </div>
        <div className="grid gap-3 p-4">
          {data?.modules.map((module) => (
            <article key={module.id} className="grid gap-3 rounded-lg border border-line bg-surface p-3 lg:grid-cols-[minmax(220px,1fr)_repeat(5,minmax(90px,120px))] lg:items-center">
              <div>
                <h3 className="font-extrabold text-slate-950">{module.name}</h3>
                <p className="text-sm text-muted">{module.type || '-'} · {module.status || '-'}</p>
              </div>
              {[
                ['Visitas', module.visits],
                ['Contratações', module.periodContracts],
                ['Cancelamentos', module.periodCancellations],
                ['Conversão', `${module.conversion}%`],
                ['Crescimento', module.growth > 0 ? `+${number(module.growth)}` : number(module.growth)],
              ].map(([label, value]) => (
                <div key={String(label)} className="text-sm">
                  <span className="block text-xs font-bold uppercase tracking-[0.1em] text-muted">{label}</span>
                  <strong className="text-lg text-slate-950">{value}</strong>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t('agileStore.admin.movement', 'Movimento')}</span>
          <h2 className="text-base font-extrabold text-slate-950">{t('agileStore.admin.visitsEvents', 'Visitas e eventos')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-surface text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Visitante</th>
                <th className="px-4 py-3">Visita</th>
                <th className="px-4 py-3">Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="px-4 py-3"><strong className="text-slate-950">{visit.companyName}</strong><small className="block text-muted">{visit.companyDocument}</small></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{visit.moduleName}</strong><small className="block text-muted">{visit.moduleType}</small></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{visit.userName || '-'}</strong><small className="block text-muted">{visit.userEmail}</small></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{dateTime(visit.visitedAt)}</strong><small className="block text-muted">IP {visit.ip || '-'}</small></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{conversionLabel(visit.conversionStatus)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t('agileStore.admin.financial', 'Financeiro')}</span>
          <h2 className="text-base font-extrabold text-slate-950">{t('agileStore.admin.contractsBilling', 'Contratações e faturamento')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-surface text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Gratuidade</th>
                <th className="px-4 py-3">Primeira cobrança</th>
                <th className="px-4 py-3">Faturamento</th>
                <th className="px-4 py-3">Contratação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3"><strong className="text-slate-950">{customer.companyName}</strong><small className="block text-muted">{customer.companyDocument}</small></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{customer.moduleName}</strong><small className="block text-muted">{customer.moduleType}</small></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{contractStatusLabel(customer.status)}</span></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{money(customer.value, customer.currency)}</strong><small className="block text-muted">{customer.billingCycle}</small></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{customer.trialUntil ? date(customer.trialUntil) : '-'}</strong>{customer.trialDays ? <small className="block text-muted">{customer.trialDays} dias</small> : null}</td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{customer.firstBillingAt ? date(customer.firstBillingAt) : '-'}</strong>{customer.billingDay ? <small className="block text-muted">Dia {customer.billingDay} do mês</small> : null}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">{billingStatusLabel(customer.billingStatus)}</span></td>
                  <td className="px-4 py-3"><strong className="text-slate-950">{date(customer.contractedAt)}</strong><small className="block text-muted">{customer.contractedBy || '-'}</small></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {customer.billingStatus !== customer.expectedBillingStatus ? (
                        <button type="button" disabled={isSubmitting} onClick={() => void runBillingAction(customer, customer.expectedBillingStatus)} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950">
                          {customer.expectedBillingStatus === 'cancelado' ? 'Marcar faturamento cancelado' : 'Marcar faturado'}
                        </button>
                      ) : null}
                      {customer.billingStatus !== 'pendente' && customer.billingStatus !== 'gratuidade' ? (
                        <button type="button" disabled={isSubmitting} onClick={() => void runBillingAction(customer, 'pendente')} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950">
                          Pendente
                        </button>
                      ) : null}
                      {customer.canCancelContract ? (
                        <button type="button" disabled={isSubmitting} onClick={() => void cancelContract(customer)} aria-label="Descontratar módulo" className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-rose-700 hover:bg-rose-50">
                          <XCircle className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {data?.events.length ? (
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="text-base font-extrabold text-slate-950">{t('agileStore.admin.recentEvents', 'Eventos recentes')}</h2>
          <div className="mt-3 grid gap-2">
            {data.events.map((event) => (
              <article key={event.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                <strong className="text-slate-950">{eventLabel(event.action)} · {event.moduleName || 'Módulo'}</strong>
                <p className="text-muted">{event.companyName} · {event.userName || 'Usuário não identificado'} · {dateTime(event.createdAt)} · IP {event.ip || '-'}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
