'use client'

import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { appData } from '@/src/services/app-data'

export default function ConfiguracoesRoutePage() {
  const { t } = useI18n()
  const modulesState = useAsyncData(() => appData.config.listModules(), [])
  const modules = modulesState.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('configuracoes.title', 'Configuration modules'), href: '/configuracoes' },
        ]}
      />

      <AsyncState isLoading={modulesState.isLoading} error={modulesState.error}>
        <SectionCard>
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-line bg-surface px-5 py-5">
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                {t('configuracoes.useChildModulesTitle', 'Use one of the child modules in the menu')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t('configuracoes.useChildModulesDescription', 'In the legacy admin, Settings is a parent group with child screens. This route is only a temporary support page until the child modules are migrated.')}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <article key={module.slug} className="rounded-[1.5rem] border border-line bg-surface px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{module.slug}</p>
                  <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">{module.nome}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{module.descricao}</p>
                </article>
              ))}
            </div>
          </div>
        </SectionCard>
      </AsyncState>
    </div>
  )
}
