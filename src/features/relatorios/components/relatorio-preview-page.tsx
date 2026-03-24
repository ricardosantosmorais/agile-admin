'use client'

import Link from 'next/link'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { useRouteParams } from '@/src/next/route-context'
import { appData } from '@/src/services/app-data'

export function RelatorioPreviewPage() {
  const { t } = useI18n()
  const { id } = useRouteParams<{ id?: string }>()
  const reportState = useAsyncData(() => (id ? appData.reports.getById(id) : Promise.resolve(null)), [id])
  const report = reportState.data

  if (!reportState.isLoading && !reportState.error && !report) {
    return (
      <SectionCard title={t('relatorios.notFound', 'Report not found')}>
        <p className="text-sm text-slate-600">{t('relatorios.notFoundDescription', 'The requested report could not be found.')}</p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-5">
      <AsyncState isLoading={reportState.isLoading} error={reportState.error}>
        {report ? (
          <>
            <PageHeader
              breadcrumbs={[
                { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
                { label: t('relatorios.title', 'Reports'), href: '/relatorios' },
                { label: report.nome, href: `/relatorios/${report.id}` },
              ]}
              actions={
                <Link href="/relatorios" className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  {t('common.back', 'Back')}
                </Link>
              }
            />

            <SectionCard title={report.nome}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-line bg-surface px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('relatorios.group', 'Group')}</p>
                  <p className="mt-2 text-sm text-slate-700">{report.grupo}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-surface px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('relatorios.code', 'Code')}</p>
                  <p className="mt-2 text-sm text-slate-700">{report.codigo}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-surface px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('common.status', 'Status')}</p>
                  <p className="mt-2 text-sm text-slate-700">{t('relatorios.readyToIntegrate', 'Ready to integrate')}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-line bg-surface px-5 py-5 text-sm leading-6 text-slate-600">
                {report.descricao}
              </div>
            </SectionCard>
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}
