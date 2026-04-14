'use client'

import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useI18n } from '@/src/i18n/use-i18n'

export function AvaliacoesPedidosPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('consultasAvaliacoesPedidos')

  if (!access.canOpen) {
    return <AccessDeniedState title={t('consultasPages.orderRatings.title', 'Avaliações de Pedidos')} />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('consultasPages.orderRatings.title', 'Avaliações de Pedidos')}
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('menuKeys.consultas', 'Consultas') },
          { label: t('consultasPages.orderRatings.title', 'Avaliações de Pedidos') },
        ]}
      />
      <SectionCard
        title={t('consultasPages.orderRatings.title', 'Avaliações de Pedidos')}
        description={t(
          'consultasPages.orderRatings.description',
          'Dashboard operacional com métricas, filtros e ações específicas sobre pedidos avaliados.',
        )}
      >
        <p className="text-sm text-slate-600">
          {t(
            'consultasPages.orderRatings.bootstrapReady',
            'A estrutura base deste módulo já está pronta para receber os indicadores, filtros avançados, grid e modais operacionais.',
          )}
        </p>
      </SectionCard>
    </div>
  )
}
