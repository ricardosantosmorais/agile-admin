'use client'

import Link from 'next/link'
import { LoaderCircle, Save } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'

const primaryButtonDisabledClasses =
  'disabled:cursor-not-allowed disabled:border disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'

type Props = {
  moduleTitle: string
  modulePath: string
  moduleDescription: string
  contextTitle: string
  contextValue: string
  contextDescription: string
  isLoading: boolean
  error?: string | null
  feedback?: string | null
  onDismissFeedback: () => void
  formId: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  canSave: boolean
  hasChanges: boolean
  saving: boolean
  children: ReactNode
}

export function ManualFormPageShell({
  moduleTitle,
  modulePath,
  moduleDescription,
  contextTitle,
  contextValue,
  contextDescription,
  isLoading,
  error,
  feedback,
  onDismissFeedback,
  formId,
  onSubmit,
  canSave,
  hasChanges,
  saving,
  children,
}: Props) {
  const { t } = useI18n()
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()

  const saveButton = (
    <button
      type="submit"
      form={formId}
      disabled={!hasChanges || saving}
      className={`inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white ${primaryButtonDisabledClasses}`}
    >
      {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {t('common.save', 'Salvar')}
    </button>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.configuracoes', 'Configurações'), href: '/configuracoes' },
          { label: moduleTitle, href: modulePath },
        ]}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canSave && !isFooterVisible ? saveButton : null}
            <Link
              href="/configuracoes"
              className="inline-flex items-center rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {t('common.back', 'Voltar')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={isLoading} error={error ?? undefined}>
        <PageToast message={feedback ?? null} onClose={onDismissFeedback} />

        <form id={formId} onSubmit={onSubmit} className="space-y-5">
          <SectionCard title={moduleTitle} description={moduleDescription}>
            <div className="rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] px-4 py-3 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{contextTitle}</p>
              <p className="mt-2 text-sm font-medium text-slate-950">{contextValue}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{contextDescription}</p>
            </div>
          </SectionCard>

          {children}

          {canSave ? (
            <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
              <button
                type="submit"
                disabled={!hasChanges || saving}
                className={`inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white ${primaryButtonDisabledClasses}`}
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
              <Link
                href="/configuracoes"
                className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                {t('common.cancel', 'Cancelar')}
              </Link>
            </div>
          ) : null}
        </form>
      </AsyncState>
    </div>
  )
}


