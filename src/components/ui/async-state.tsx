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

  const resolvedLoadingTitle = loadingTitle ?? t('async.loadingTitle', 'Loading data')
  const resolvedLoadingDescription = loadingDescription ?? t('async.loadingDescription', 'Preparing the information for this area.')
  const resolvedErrorTitle = errorTitle ?? t('async.errorTitle', 'Could not load the data')

  if (isLoading) {
    return (
      <SectionCard title={resolvedLoadingTitle} description={resolvedLoadingDescription}>
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-[1rem] bg-[#f2eee5]" />
          <div className="h-12 animate-pulse rounded-[1rem] bg-[#f6f3eb]" />
          <div className="h-12 animate-pulse rounded-[1rem] bg-[#f2eee5]" />
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
