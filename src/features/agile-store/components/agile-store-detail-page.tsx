'use client'

import { ArrowLeft, CheckCircle2, FileText, ImageIcon, Lock, PlayCircle, RefreshCcw, Store, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { agileStoreClient } from '@/src/features/agile-store/services/agile-store-client'
import { getAgileStoreActionStatus, getAgileStoreStatusInfo } from '@/src/features/agile-store/services/agile-store-mappers'
import type { AgileStoreAction, AgileStoreModule, AgileStorePermissions } from '@/src/features/agile-store/types/agile-store'
import { getFeatureAccess } from '@/src/features/auth/services/permissions'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useI18n } from '@/src/i18n/use-i18n'

function money(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value || 0)
}

function actionForStatus(status: AgileStoreModule['contractStatus']): AgileStoreAction {
  if (status === 'falha_ativacao' || status === 'falha_desativacao') return 'retry'
  if (status === 'ativo') return 'cancel'
  return 'contract'
}

function actionLabel(action: AgileStoreAction) {
  return {
    contract: 'Contratar módulo',
    cancel: 'Descontratar módulo',
    retry: 'Reprocessar solicitação',
  }[action]
}

function actionConfirmation(action: AgileStoreAction) {
  return {
    contract: 'Confirme a contratação deste módulo para a empresa atual.',
    cancel: 'Confirme o cancelamento deste módulo para a empresa atual.',
    retry: 'A última ação com falha será executada novamente para esta empresa.',
  }[action]
}

function mediaGroup(mediaType: string) {
  const type = mediaType.toLowerCase()
  if (type.includes('video')) return 'video'
  if (type.includes('screenshot') || type.includes('imagem') || type.includes('image') || type.includes('foto')) return 'screenshot'
  return 'material'
}

function historyTitle(action: string) {
  const titles: Record<string, string> = {
    contratar: 'Contratação',
    descontratar: 'Descontratação',
    reprocessar: 'Reprocessamento',
  }
  return titles[action] ?? (action || 'Movimento')
}

function ActionIcon({ action }: { action: AgileStoreAction }) {
  if (action === 'cancel') return <XCircle className="h-4 w-4" />
  if (action === 'retry') return <RefreshCcw className="h-4 w-4" />
  return <CheckCircle2 className="h-4 w-4" />
}

export function AgileStoreDetailPage({ moduleId, permissions }: { moduleId: string; permissions?: AgileStorePermissions }) {
  const { session } = useAuth()
  const { t } = useI18n()
  const [module, setModule] = useState<AgileStoreModule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolvedPermissions = useMemo(() => {
    if (permissions) return permissions
    const access = getFeatureAccess(session, 'agileStore')
    return {
      canContract: access.canCreate,
      canCancel: access.canDelete,
    }
  }, [permissions, session])

  useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      void agileStoreClient
        .detail(moduleId)
        .then((response) => {
          if (mounted) setModule(response)
        })
        .catch((reason: unknown) => {
          if (mounted) setError(reason instanceof Error ? reason.message : t('agileStore.errors.detail', 'Não foi possível carregar o módulo.'))
        })
        .finally(() => {
          if (mounted) setIsLoading(false)
        })
    }, 0)
    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [moduleId, t])

  async function runAction() {
    if (!module) return
    const action = actionForStatus(module.contractStatus)
    const actionStatus = getAgileStoreActionStatus(module, action, resolvedPermissions)
    if (!actionStatus.enabled) {
      setActionMessage('')
      return
    }
    if (!window.confirm(actionConfirmation(action))) {
      return
    }

    setIsSubmitting(true)
    setActionMessage('')
    try {
      await agileStoreClient.action(module.id, action)
      const reloaded = await agileStoreClient.detail(module.id)
      setModule(reloaded)
      setActionMessage(t('agileStore.actionSuccess', 'Ação enviada com sucesso.'))
    } catch (reason) {
      setActionMessage(reason instanceof Error ? reason.message : t('agileStore.errors.action', 'Não foi possível processar a ação.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-slate-500">{t('common.loading', 'Carregando...')}</div>
  }

  if (error || !module) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error || t('agileStore.errors.notFound', 'Módulo não encontrado.')}</div>
  }

  const status = getAgileStoreStatusInfo(module.contractStatus)
  const action = actionForStatus(module.contractStatus)
  const actionStatus = getAgileStoreActionStatus(module, action, resolvedPermissions)
  const videos = module.media.filter((item) => mediaGroup(item.type) === 'video')
  const screenshots = module.media.filter((item) => mediaGroup(item.type) === 'screenshot')
  const materials = module.media.filter((item) => mediaGroup(item.type) === 'material')

  return (
    <main className="space-y-5">
      <Link href="/agile-store" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-accent">
        <ArrowLeft className="h-4 w-4" />
        {t('agileStore.back', 'Voltar para Agile Store')}
      </Link>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-[1.6rem] bg-slate-950 text-white">
          <div className="relative min-h-[320px] p-6">
            {module.coverImageUrl ? <img src={module.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /> : null}
            <div className="relative z-[1] flex min-h-[270px] flex-col justify-end">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/15">
                <Store className="h-8 w-8" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{module.type || t('agileStore.module', 'Módulo')}</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-normal">{module.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80">{module.description || module.summary}</p>
            </div>
          </div>
        </div>

        <aside className="app-shell-card-modern rounded-[1.6rem] p-5">
          <span className={['inline-flex rounded-full px-3 py-1 text-xs font-bold', status.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : status.tone === 'warning' ? 'bg-amber-50 text-amber-700' : status.tone === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'].join(' ')}>
            {status.label}
          </span>
          <div className="mt-5">
            <p className="text-3xl font-extrabold text-slate-950">{money(module.price, module.currency)}</p>
            <p className="text-sm font-semibold text-slate-500">{module.billingCycle === 'mensal' ? 'por mês' : module.billingCycle}</p>
          </div>
          {module.trial.available && module.trial.days > 0 ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{module.trial.days} dias grátis</p> : null}
          {!actionStatus.enabled ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionStatus.message}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void runAction()}
            disabled={isSubmitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ActionIcon action={action} />
            {actionLabel(action)}
          </button>
          {actionMessage ? <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-slate-700">{actionMessage}</p> : null}
        </aside>
      </section>

      {module.benefits.length ? (
        <section className="app-shell-card-modern rounded-[1.6rem] p-5">
          <h2 className="text-lg font-extrabold text-slate-950">{t('agileStore.benefits', 'Principais ganhos')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {module.benefits.map((benefit) => <div key={benefit} className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700">{benefit}</div>)}
          </div>
        </section>
      ) : null}

      {videos.length ? (
        <section className="app-shell-card-modern rounded-[1.6rem] p-5">
          <h2 className="text-lg font-extrabold text-slate-950">{t('agileStore.videos', 'Vídeos')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {videos.map((item) => (
              <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-slate-950">
                <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span>
                  <strong className="block text-slate-950">{item.title || t('agileStore.video', 'Vídeo')}</strong>
                  {item.description ? <span className="mt-1 block text-xs font-medium text-muted">{item.description}</span> : null}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {screenshots.length ? (
        <section className="app-shell-card-modern rounded-[1.6rem] p-5">
          <h2 className="text-lg font-extrabold text-slate-950">{t('agileStore.gallery', 'Galeria')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {screenshots.map((item) => (
              <figure key={item.url} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={item.url} alt={item.title || module.name} className="aspect-video w-full object-cover" />
                </a>
                {(item.title || item.description) ? (
                  <figcaption className="px-4 py-3 text-sm">
                    {item.title ? <strong className="block text-slate-950">{item.title}</strong> : null}
                    {item.description ? <span className="mt-1 block text-xs font-medium text-muted">{item.description}</span> : null}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {materials.length ? (
        <section className="app-shell-card-modern rounded-[1.6rem] p-5">
          <h2 className="text-lg font-extrabold text-slate-950">{t('agileStore.materials', 'Materiais')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {materials.map((item) => (
              <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-slate-950">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span>
                  <strong className="block text-slate-950">{item.title || t('agileStore.material', 'Material')}</strong>
                  {item.description ? <span className="mt-1 block text-xs font-medium text-muted">{item.description}</span> : null}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {module.history.length ? (
        <section className="app-shell-card-modern rounded-[1.6rem] p-5">
          <h2 className="text-lg font-extrabold text-slate-950">{t('agileStore.history', 'Histórico')}</h2>
          <div className="mt-4 space-y-3">
            {module.history.map((item) => (
              <div key={item.id || `${item.action}-${item.createdAt}`} className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-700">
                <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <strong className="text-slate-950">{historyTitle(item.action)}</strong>
                  {item.status ? <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{item.status}</span> : null}
                  {item.message ? <p className="mt-1 font-medium">{item.message}</p> : null}
                  {item.createdAt ? <p className="mt-1 text-xs font-medium text-muted">{item.createdAt}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
