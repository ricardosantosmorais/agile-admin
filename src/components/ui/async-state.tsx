import type { PropsWithChildren, ReactNode } from 'react'
import { useI18n } from '@/src/i18n/use-i18n'
import { SectionCard } from './section-card'

type AsyncStateProps = PropsWithChildren<{
  isLoading: boolean
  error?: string
  loadingTitle?: string
  loadingDescription?: string
  errorTitle?: string
  errorAction?: ReactNode
}>

export function AsyncState({
  children,
  isLoading,
  error,
  loadingTitle,
  loadingDescription,
  errorTitle,
  errorAction,
}: AsyncStateProps) {
  const { t } = useI18n()

  const resolvedLoadingTitle = loadingTitle ?? t('async.loadingTitle', 'Carregando dados')
  const resolvedLoadingDescription = loadingDescription ?? t('async.loadingDescription', 'Preparando as informações desta área.')
  const resolvedErrorTitle = errorTitle ?? t('async.errorTitle', 'Não foi possível carregar os dados')

  if (isLoading) {
    return (
      <SectionCard title={resolvedLoadingTitle} description={resolvedLoadingDescription}>
        <div className="space-y-3">
          <div className="app-pane-muted h-12 animate-pulse rounded-[1rem]" />
          <div className="app-pane-muted h-12 animate-pulse rounded-[1rem]" />
          <div className="app-pane-muted h-12 animate-pulse rounded-[1rem]" />
        </div>
      </SectionCard>
    )
  }

  if (error) {
    return (
      <SectionCard title={resolvedErrorTitle}>
        <p className="text-sm text-slate-600">{error}</p>
        {errorAction ? <div className="mt-4">{errorAction}</div> : null}
      </SectionCard>
    )
  }

  return <>{children}</>
}
