'use client'

import { ArrowLeft, CheckCircle2, ExternalLink, FileText, ImageIcon, Lock, PlayCircle, RefreshCcw, Store, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { agileStoreClient } from '@/src/features/agile-store/services/agile-store-client'
import { getAgileStoreActionStatus, getAgileStoreStatusInfo } from '@/src/features/agile-store/services/agile-store-mappers'
import type { AgileStoreAction, AgileStoreModule, AgileStorePermissions } from '@/src/features/agile-store/types/agile-store'
import { getFeatureAccess } from '@/src/features/auth/services/permissions'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useI18n } from '@/src/i18n/use-i18n'

function money(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value || 0)
}

function badgeTone(tone: ReturnType<typeof getAgileStoreStatusInfo>['tone']) {
  if (tone === 'muted') return 'neutral'
  return tone
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

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url)
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

function DetailHeader({ title }: { title?: string }) {
  const { t } = useI18n()

  return (
    <PageHeader
      title={title || t('agileStore.title', 'Agile Store')}
      breadcrumbs={[
        { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
        { label: t('agileStore.title', 'Agile Store'), href: '/agile-store' },
        { label: title || t('agileStore.module', 'Módulo') },
      ]}
      actions={
        <Link href="/agile-store" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" />
          {t('agileStore.back', 'Voltar')}
        </Link>
      }
    />
  )
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
    return (
      <div className="space-y-5">
        <DetailHeader />
        <AsyncState
          isLoading
          loadingTitle={t('agileStore.loadingDetailTitle', 'Carregando módulo')}
          loadingDescription={t('agileStore.loadingDetailDescription', 'Buscando as informações comerciais e materiais do módulo.')}
        />
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="space-y-5">
        <DetailHeader />
        <AsyncState isLoading={false} error={error || t('agileStore.errors.notFound', 'Módulo não encontrado.')} />
      </div>
    )
  }

  const status = getAgileStoreStatusInfo(module.contractStatus)
  const action = actionForStatus(module.contractStatus)
  const actionStatus = getAgileStoreActionStatus(module, action, resolvedPermissions)
  const videos = module.media.filter((item) => mediaGroup(item.type) === 'video')
  const screenshots = module.media.filter((item) => mediaGroup(item.type) === 'screenshot')
  const materials = module.media.filter((item) => mediaGroup(item.type) === 'material')

  return (
    <div className="space-y-5">
      <DetailHeader title={module.name} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <SectionCard
            title={module.name || t('agileStore.module', 'Módulo')}
            description={module.summary || t('agileStore.detailDescriptionFallback', 'Detalhes do módulo selecionado na Agile Store.')}
            action={
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={badgeTone(status.tone)}>{status.label}</StatusBadge>
                {module.type ? <StatusBadge tone="info">{module.type}</StatusBadge> : null}
              </div>
            }
          >
            <div className="rounded-[1.25rem] border border-line/60 bg-[color:var(--app-soft)]/55 p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.1rem] border border-line/60 text-white shadow-sm"
                  style={{ backgroundColor: module.primaryColor || '#2f5bea' }}
                >
                  {module.coverImageUrl ? (
                    <img src={module.coverImageUrl} alt="" className="h-full w-full rounded-[1.1rem] object-cover" />
                  ) : (
                    <Store className="h-7 w-7" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{t('agileStore.eyebrow', 'Loja de Aplicativos')}</p>
                  <p className="mt-3 max-w-4xl break-words text-sm leading-7 text-[color:var(--app-text)]">{module.description || module.summary || '-'}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {module.benefits.length ? (
            <SectionCard title={t('agileStore.benefits', 'Principais ganhos')}>
              <div className="grid gap-3 md:grid-cols-2">
                {module.benefits.map((benefit) => (
                  <div key={benefit} className="app-pane-muted flex min-w-0 items-start gap-2 rounded-[1rem] border px-4 py-3 text-sm font-semibold text-[color:var(--app-text)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="min-w-0 break-words">{benefit}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {videos.length ? (
            <SectionCard title={t('agileStore.videos', 'Vídeos')}>
              <div className="space-y-4">
                {videos.map((item) => (
                  <article key={item.url} className="app-pane overflow-hidden rounded-[1.1rem]">
                    {isVideoFile(item.url) ? (
                      <video controls preload="metadata" src={item.url} className="aspect-video w-full bg-slate-950" />
                    ) : null}
                    <div className="flex gap-3 p-4">
                      <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 font-bold text-(--app-text) transition hover:text-accent">
                          <span className="truncate">{item.title || t('agileStore.video', 'Vídeo')}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                        {item.description ? <p className="mt-1 break-words text-xs font-medium leading-5 text-[color:var(--app-muted)]">{item.description}</p> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {screenshots.length ? (
            <SectionCard title={t('agileStore.gallery', 'Imagens do módulo')}>
              <div className="grid gap-4 md:grid-cols-2">
                {screenshots.map((item) => (
                  <figure key={item.url} className="app-pane overflow-hidden rounded-[1.1rem]">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={item.url} alt={item.title || module.name} className="aspect-video w-full object-cover" />
                    </a>
                    {(item.title || item.description) ? (
                      <figcaption className="px-4 py-3 text-sm">
                        {item.title ? <strong className="block break-words text-(--app-text)">{item.title}</strong> : null}
                        {item.description ? <span className="mt-1 block break-words text-xs font-medium leading-5 text-[color:var(--app-muted)]">{item.description}</span> : null}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {materials.length ? (
            <SectionCard title={t('agileStore.materials', 'Material técnico')}>
              <div className="grid gap-3 md:grid-cols-2">
                {materials.map((item) => (
                  <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="app-pane flex min-w-0 gap-3 rounded-[1rem] p-4 text-sm font-semibold transition hover:border-slate-300 hover:text-accent">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="min-w-0">
                      <strong className="block truncate text-(--app-text)">{item.title || t('agileStore.material', 'Material')}</strong>
                      {item.description ? <span className="mt-1 block break-words text-xs font-medium leading-5 text-[color:var(--app-muted)]">{item.description}</span> : null}
                    </span>
                  </a>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title={t('agileStore.history', 'Histórico')}>
            {module.history.length ? (
              <div className="space-y-3">
                {module.history.map((item) => (
                  <div key={item.id || `${item.action}-${item.createdAt}`} className="app-pane flex min-w-0 gap-3 rounded-[1rem] p-4 text-sm text-[color:var(--app-text)]">
                    <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{historyTitle(item.action)}</strong>
                        {item.status ? <StatusBadge tone="neutral">{item.status}</StatusBadge> : null}
                      </div>
                      {item.message ? <p className="mt-1 break-words font-medium">{item.message}</p> : null}
                      {item.createdAt ? <p className="mt-1 text-xs font-medium text-[color:var(--app-muted)]">{item.createdAt}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="app-pane-muted rounded-[1rem] border border-dashed px-4 py-8 text-center text-sm text-slate-500">
                {t('agileStore.historyEmpty', 'Ainda não há movimentações para este módulo.')}
              </div>
            )}
          </SectionCard>
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <SectionCard>
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={badgeTone(status.tone)}>{status.label}</StatusBadge>
                {module.trial.available && module.trial.days > 0 ? <StatusBadge tone="warning">{module.trial.days} dias grátis</StatusBadge> : null}
              </div>

              <div>
                <p className="text-3xl font-black tracking-tight text-(--app-text)">{money(module.price, module.currency)}</p>
                <p className="text-sm font-semibold text-[color:var(--app-muted)]">{module.billingCycle === 'mensal' ? 'por mês' : module.billingCycle}</p>
              </div>

              {!actionStatus.enabled ? (
                <div className="flex gap-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">{actionStatus.message}</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void runAction()}
                disabled={isSubmitting}
                className="app-button-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ActionIcon action={action} />
                {actionLabel(action)}
              </button>

              {actionMessage ? <p className="app-pane-muted rounded-[1rem] px-4 py-3 text-sm font-semibold text-[color:var(--app-text)]">{actionMessage}</p> : null}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}
