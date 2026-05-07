'use client'

import { Search, Store } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { agileStoreClient } from '@/src/features/agile-store/services/agile-store-client'
import { getAgileStoreStatusInfo } from '@/src/features/agile-store/services/agile-store-mappers'
import type { AgileStoreListResponse, AgileStoreModule } from '@/src/features/agile-store/types/agile-store'
import { useI18n } from '@/src/i18n/use-i18n'

function money(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value || 0)
}

function ModuleCard({ module }: { module: AgileStoreModule }) {
  const status = getAgileStoreStatusInfo(module.contractStatus)
  return (
    <Link
      href={`/agile-store/${encodeURIComponent(module.id)}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lg"
      aria-label={`${module.name} - ${module.summary}`}
    >
      <div className="relative h-40 overflow-hidden bg-slate-950">
        {module.coverImageUrl ? (
          <img src={module.coverImageUrl} alt="" className="h-full w-full object-cover opacity-80 transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: module.primaryColor }}>
            <Store className="h-14 w-14 text-white/80" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 rounded-2xl bg-white px-3 py-1 text-xs font-bold text-slate-900">{module.type || 'Modulo'}</div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-950">{module.name}</h2>
          <span className={['rounded-full px-2.5 py-1 text-[11px] font-bold', status.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : status.tone === 'warning' ? 'bg-amber-50 text-amber-700' : status.tone === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'].join(' ')}>
            {status.label}
          </span>
        </div>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{module.summary}</p>

        {module.benefits.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {module.benefits.slice(0, 3).map((benefit) => (
              <span key={benefit} className="rounded-full bg-accentSoft px-2.5 py-1 text-[11px] font-semibold text-accent">{benefit}</span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-lg font-extrabold text-slate-950">{money(module.price, module.currency)}</p>
            <p className="text-xs font-semibold text-slate-500">{module.billingCycle === 'mensal' ? 'por mês' : module.billingCycle}</p>
          </div>
          {module.trial.available && module.trial.days > 0 ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{module.trial.days} dias grátis</span>
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

  useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      void agileStoreClient
        .list({ page: 1, perpage: 12, q: search, tipo: type, status })
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
  }, [search, status, t, type])

  const types = useMemo(() => data?.filters.types ?? [], [data])

  return (
    <main className="space-y-5">
      <section className="rounded-[1.6rem] bg-slate-950 px-6 py-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{t('agileStore.eyebrow', 'Loja de Aplicativos')}</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-normal">{t('agileStore.title', 'Agile Store')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{t('agileStore.description', 'Módulos prontos para ativar recursos, ampliar a operação e acompanhar contratações por empresa.')}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <strong className="block text-2xl">{data?.summary.totalModules ?? 0}</strong>
              <span className="text-xs text-white/70">{t('agileStore.modules', 'módulos')}</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <strong className="block text-2xl">{data?.summary.activeContracts ?? 0}</strong>
              <span className="text-xs text-white/70">{t('agileStore.contracted', 'contratados')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
        <label className="app-control flex items-center gap-2 rounded-2xl px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-full border-0 bg-transparent text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('agileStore.searchPlaceholder', 'Buscar por nome, tipo ou benefício')} />
        </label>
        <select className="app-control rounded-2xl px-3 py-2 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">{t('agileStore.allTypes', 'Todos os tipos')}</option>
          {types.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="app-control flex rounded-2xl p-1">
          {[
            ['', t('agileStore.all', 'Todos')],
            ['contratados', t('agileStore.onlyContracted', 'Contratados')],
            ['disponiveis', t('agileStore.available', 'Disponíveis')],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setStatus(value)} className={['flex-1 rounded-xl px-3 py-2 text-xs font-bold transition', status === value ? 'bg-accent text-white' : 'text-slate-500 hover:text-slate-950'].join(' ')}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      {isLoading ? <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-slate-500">{t('common.loading', 'Carregando...')}</div> : null}
      {!isLoading && !data?.items.length ? <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-slate-500">{t('agileStore.empty', 'Nenhum módulo encontrado com os filtros atuais.')}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((module) => <ModuleCard key={module.id} module={module} />)}
      </section>
    </main>
  )
}
