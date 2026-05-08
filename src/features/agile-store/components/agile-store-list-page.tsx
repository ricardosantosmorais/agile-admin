'use client'

import { RefreshCcw, Search, Store } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { agileStoreClient } from '@/src/features/agile-store/services/agile-store-client'
import { getAgileStoreStatusInfo } from '@/src/features/agile-store/services/agile-store-mappers'
import type { AgileStoreListResponse, AgileStoreModule } from '@/src/features/agile-store/types/agile-store'
import { useI18n } from '@/src/i18n/use-i18n'

function money(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value || 0)
}

function badgeTone(tone: ReturnType<typeof getAgileStoreStatusInfo>['tone']) {
  if (tone === 'muted') return 'neutral'
  return tone
}

function ModuleCard({ module }: { module: AgileStoreModule }) {
  const status = getAgileStoreStatusInfo(module.contractStatus)

  return (
    <Link
      href={`/agile-store/${encodeURIComponent(module.id)}`}
      className="app-pane group flex h-full min-w-0 flex-col rounded-[1.25rem] p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600"
      aria-label={`${module.name} - ${module.summary}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-line/60 text-white shadow-sm"
          style={{ backgroundColor: module.primaryColor || '#2f5bea' }}
        >
          {module.coverImageUrl ? (
            <img src={module.coverImageUrl} alt="" className="h-full w-full rounded-[1rem] object-cover" />
          ) : (
            <Store className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="min-w-0 truncate text-base font-black tracking-tight text-(--app-text)">{module.name || '-'}</h2>
            <StatusBadge tone={badgeTone(status.tone)}>{status.label}</StatusBadge>
          </div>
          <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{module.type || 'Módulo'}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <p className="mt-4 line-clamp-3 min-h-[4.5rem] break-words text-sm leading-6 text-[color:var(--app-muted)]">{module.summary || module.description || '-'}</p>

        {module.benefits.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {module.benefits.slice(0, 3).map((benefit) => (
              <span key={benefit} className="max-w-full truncate rounded-full bg-accentSoft px-2.5 py-1 text-[11px] font-semibold text-accent">{benefit}</span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex min-w-0 items-end justify-between gap-3 border-t border-line/60 pt-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-(--app-text)">{money(module.price, module.currency)}</p>
            <p className="text-xs font-semibold text-[color:var(--app-muted)]">{module.billingCycle === 'mensal' ? 'por mês' : module.billingCycle}</p>
          </div>
          {module.trial.available && module.trial.days > 0 ? (
            <StatusBadge tone="warning">{module.trial.days} dias grátis</StatusBadge>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export function AgileStoreListPage() {
  const { t } = useI18n()
  const [data, setData] = useState<AgileStoreListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      void agileStoreClient
        .list({ page, perpage: 12, q: search, tipo: type, status })
        .then((response) => {
          if (mounted) setData(response)
        })
        .catch((reason: unknown) => {
          if (mounted) setError(reason instanceof Error ? reason.message : t('agileStore.errors.load', 'Não foi possível carregar a Agile Store.'))
        })
        .finally(() => {
          if (mounted) setIsLoading(false)
        })
    }, 120)

    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [page, refreshToken, search, status, t, type])

  const types = useMemo(() => data?.filters.types ?? [], [data])
  const pages = data?.meta.pages ?? 1

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function updateType(value: string) {
    setType(value)
    setPage(1)
  }

  function updateStatus(value: string) {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('agileStore.title', 'Agile Store')}
        breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('agileStore.title', 'Agile Store') }]}
        actions={
          <button type="button" onClick={() => setRefreshToken((current) => current + 1)} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
            <RefreshCcw className="h-4 w-4" />
            {t('common.refresh', 'Atualizar')}
          </button>
        }
      />

      <AsyncState
        isLoading={isLoading}
        error={error}
        loadingTitle={t('agileStore.loadingListTitle', 'Carregando módulos')}
        loadingDescription={t('agileStore.loadingListDescription', 'Preparando o catálogo de módulos da Agile Store.')}
        errorAction={
          <button type="button" onClick={() => setRefreshToken((current) => current + 1)} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
            <RefreshCcw className="h-4 w-4" />
            {t('common.refresh', 'Atualizar')}
          </button>
        }
      >
        <SectionCard>
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-accentSoft text-accent">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{t('agileStore.eyebrow', 'Loja de Aplicativos')}</p>
                  <h1 className="mt-1 text-xl font-black tracking-tight text-(--app-text)">{t('agileStore.marketplaceTitle', 'Módulos para ampliar a operação')}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--app-muted)]">
                    {t('agileStore.marketplaceDescription', 'Encontre recursos prontos para ativar novas frentes, acompanhar contratos e evoluir a operação da empresa sem sair do Admin.')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <StatusBadge tone="info">{t('agileStore.summaryModules', '{{count}} módulos', { count: data?.summary.totalModules ?? 0 })}</StatusBadge>
                <StatusBadge tone="success">{t('agileStore.summaryContracts', '{{count}} contratados', { count: data?.summary.activeContracts ?? 0 })}</StatusBadge>
              </div>
            </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_220px_minmax(320px,360px)]">
            <label className="app-control flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder={t('agileStore.searchPlaceholder', 'Buscar por nome, tipo ou benefício')} />
            </label>
            <select className="app-control min-w-0 rounded-2xl px-3 py-2 text-sm" value={type} onChange={(event) => updateType(event.target.value)}>
              <option value="">{t('agileStore.allTypes', 'Todos os tipos')}</option>
              {types.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <div className="app-control grid min-w-[280px] grid-cols-3 rounded-2xl p-1">
              {[
                ['', t('agileStore.all', 'Todos')],
                ['contratados', t('agileStore.onlyContracted', 'Contratados')],
                ['disponiveis', t('agileStore.available', 'Disponíveis')],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => updateStatus(value)} className={['min-w-0 truncate whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition', status === value ? 'bg-accent text-white' : 'text-slate-500 hover:text-slate-950'].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!data?.items.length ? <div className="app-pane-muted rounded-[1rem] border border-dashed px-4 py-8 text-center text-sm text-slate-500">{t('agileStore.empty', 'Nenhum módulo encontrado com os filtros atuais.')}</div> : null}

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data?.items.map((module) => <ModuleCard key={module.id} module={module} />)}
          </section>

          {pages > 1 ? (
            <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={t('agileStore.pagination', 'Paginação da Agile Store')}>
              {Array.from({ length: pages }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Página ${item}`}
                  aria-current={page === item ? 'page' : undefined}
                  onClick={() => setPage(item)}
                  className={['h-10 min-w-10 rounded-xl border px-3 text-sm font-bold transition', page === item ? 'border-accent bg-accent text-white' : 'border-line bg-white text-slate-600 hover:text-slate-950'].join(' ')}
                >
                  {item}
                </button>
              ))}
            </nav>
          ) : null}
          </div>
        </SectionCard>
      </AsyncState>
    </div>
  )
}
