'use client'

import { ArrowLeft, CheckCircle2, ExternalLink, FileText, ImageIcon, Lock, MessageSquare, PlayCircle, RefreshCcw, Store, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
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

function requiresFeedback(action: AgileStoreAction) {
  return action === 'contract' || action === 'cancel'
}

function feedbackMotives(action: AgileStoreAction) {
  if (action === 'cancel') {
    return [
      'Contratado por engano',
      'Mudança de processo',
      'Não atendeu a necessidade',
      'Não utilizei',
      'Redução de custo',
      'Outro',
    ]
  }

  return [
    'Atender solicitação interna',
    'Melhorar operação',
    'Reduzir retrabalho',
    'Substituir sistema já existente',
    'Testar o módulo',
    'Outro',
  ]
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
  const [pendingAction, setPendingAction] = useState<AgileStoreAction | null>(null)
  const [feedbackMotive, setFeedbackMotive] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackError, setFeedbackError] = useState('')

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

  function openActionModal() {
    if (!module) return
    const action = actionForStatus(module.contractStatus)
    const actionStatus = getAgileStoreActionStatus(module, action, resolvedPermissions)
    if (!actionStatus.enabled) {
      setActionMessage('')
      return
    }
    setPendingAction(action)
    setFeedbackMotive('')
    setFeedbackMessage('')
    setFeedbackError('')
  }

  function closeActionModal() {
    if (isSubmitting) return
    setPendingAction(null)
    setFeedbackMotive('')
    setFeedbackMessage('')
    setFeedbackError('')
  }

  async function confirmAction() {
    if (!module || !pendingAction) return
    if (requiresFeedback(pendingAction) && !feedbackMotive.trim()) {
      setFeedbackError(t('agileStore.feedbackRequired', 'Selecione um motivo para continuar.'))
      return
    }

    setIsSubmitting(true)
    setActionMessage('')
    setFeedbackError('')
    try {
      await agileStoreClient.action(module.id, pendingAction, requiresFeedback(pendingAction) ? {
        motive: feedbackMotive.trim(),
        message: feedbackMessage.trim(),
      } : undefined)
      const reloaded = await agileStoreClient.detail(module.id)
      setModule(reloaded)
      setActionMessage(t('agileStore.actionSuccess', 'Ação enviada com sucesso.'))
      setPendingAction(null)
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
                      <video controls preload="metadata" poster={item.posterUrl || undefined} src={item.url} className="aspect-video w-full bg-slate-950" />
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
                      {(item.feedbackMotive || item.feedbackMessage) ? (
                        <div className="mt-3 rounded-[0.9rem] border border-line/70 bg-[color:var(--app-soft)]/70 px-3 py-2 text-xs">
                          <strong className="flex items-center gap-2 text-[color:var(--app-text)]">
                            <MessageSquare className="h-3.5 w-3.5 text-accent" />
                            {item.feedbackMotive || t('agileStore.feedback', 'Feedback')}
                          </strong>
                          {item.feedbackMessage ? <span className="mt-1 block break-words leading-5 text-[color:var(--app-muted)]">{item.feedbackMessage}</span> : null}
                        </div>
                      ) : null}
                      {item.error ? <p className="mt-2 break-words text-xs font-semibold text-rose-600">{item.error}</p> : null}
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
                onClick={openActionModal}
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

      <OverlayModal
        open={Boolean(pendingAction && requiresFeedback(pendingAction))}
        title={pendingAction ? actionLabel(pendingAction) : ''}
        onClose={closeActionModal}
        maxWidthClassName="max-w-xl"
        bodyScrollable={false}
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-[color:var(--app-muted)]">{pendingAction ? actionConfirmation(pendingAction) : ''}</p>
          <label className="space-y-2 text-sm font-semibold text-[color:var(--app-text)]">
            <span>{t('agileStore.feedbackMotive', 'Motivo')} <span className="text-rose-500">*</span></span>
            <select
              className="app-input h-11"
              value={feedbackMotive}
              aria-invalid={Boolean(feedbackError)}
              onChange={(event) => {
                setFeedbackMotive(event.target.value)
                if (event.target.value) setFeedbackError('')
              }}
            >
              <option value="">{t('agileStore.feedbackMotivePlaceholder', 'Selecione um motivo')}</option>
              {(pendingAction ? feedbackMotives(pendingAction) : []).map((motive) => (
                <option key={motive} value={motive}>{motive}</option>
              ))}
            </select>
            {feedbackError ? <span className="block text-xs font-semibold text-rose-600">{feedbackError}</span> : null}
          </label>
          <label className="space-y-2 text-sm font-semibold text-[color:var(--app-text)]">
            <span>{t('agileStore.feedbackMessage', 'Mensagem opcional')}</span>
            <textarea
              className="app-input min-h-28 resize-y py-3"
              maxLength={2000}
              value={feedbackMessage}
              onChange={(event) => setFeedbackMessage(event.target.value)}
              placeholder={t('agileStore.feedbackMessagePlaceholder', 'Se quiser, registre um comentário para acompanhamento.')}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold" onClick={closeActionModal}>
              {t('common.cancel', 'Cancelar')}
            </button>
            <button type="button" disabled={isSubmitting} className="app-button-primary rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60" onClick={() => void confirmAction()}>
              {pendingAction ? actionLabel(pendingAction) : t('common.confirm', 'Confirmar')}
            </button>
          </div>
        </div>
      </OverlayModal>

      <ConfirmDialog
        open={Boolean(pendingAction && !requiresFeedback(pendingAction))}
        title={pendingAction ? actionLabel(pendingAction) : ''}
        description={pendingAction ? actionConfirmation(pendingAction) : ''}
        confirmLabel={pendingAction ? actionLabel(pendingAction) : t('common.confirm', 'Confirmar')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        tone="default"
        isLoading={isSubmitting}
        onClose={closeActionModal}
        onConfirm={() => void confirmAction()}
      />
    </div>
  )
}
