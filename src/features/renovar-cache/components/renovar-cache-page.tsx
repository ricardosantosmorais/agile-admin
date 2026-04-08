'use client'

import { Loader2, RefreshCcw } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { renovarCacheClient } from '@/src/features/renovar-cache/services/renovar-cache-client'
import { useI18n } from '@/src/i18n/use-i18n'

type ToastState = {
  tone: 'success' | 'error'
  message: string
}

export function RenovarCachePage() {
  const { t } = useI18n()
  const access = useFeatureAccess('renovarCache')
  const [isRunning, setIsRunning] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  if (!access.canOpen) {
    return <AccessDeniedState title={t('maintenance.renewCache.title', 'Renovar Cache')} backHref="/dashboard" />
  }

  async function handleRenewCache() {
    setIsRunning(true)

    try {
      const response = await renovarCacheClient.renew()
      setToast({
        tone: 'success',
        message: response.message || t('maintenance.renewCache.success', 'Cache renovado com sucesso.'),
      })
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.renewCache.error', 'Não foi possível renovar o cache.'),
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.manutencao', 'Manutenção'), href: '/sequenciais' },
          { label: t('maintenance.renewCache.title', 'Renovar Cache'), href: '/renovar-cache' },
        ]}
      />

      <SectionCard
        title={t('maintenance.renewCache.title', 'Renovar Cache')}
        description={t(
          'maintenance.renewCache.description',
          'Executa a renovação de cache da empresa ativa para refletir alterações recentes no site e na API.',
        )}
        action={(
          <button
            type="button"
            onClick={handleRenewCache}
            disabled={isRunning}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {isRunning
              ? t('maintenance.renewCache.running', 'Renovando cache...')
              : t('maintenance.renewCache.action', 'Renovar cache')}
          </button>
        )}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <div className="rounded-[1.2rem] border border-[#ece4d8] bg-[#fcfaf5] px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7dece] bg-white text-slate-700">
                {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
              </span>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-950">
                  {isRunning
                    ? t('maintenance.renewCache.running', 'Renovando cache...')
                    : t('maintenance.renewCache.action', 'Renovar cache')}
                </div>
                <p className="text-sm text-slate-600">
                  {t(
                    'maintenance.renewCache.description',
                    'Executa a renovação de cache da empresa ativa para refletir alterações recentes no site e na API.',
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[#ece4d8] bg-white px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('maintenance.renewCache.title', 'Renovar Cache')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">01</div>
            <p className="mt-2 text-sm text-slate-500">
              {isRunning
                ? t('maintenance.renewCache.running', 'Renovando cache...')
                : t('maintenance.renewCache.action', 'Renovar cache')}
            </p>
          </div>
        </div>
      </SectionCard>

      {toast ? (
        <PageToast
          variant={toast.tone === 'success' ? 'success' : 'danger'}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  )
}
