'use client'

import { CircleDollarSign, Gift, ScanSearch, TicketPercent } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { CupomDescontoOcorrenciasTab } from '@/src/features/cupons-desconto/components/cupom-desconto-ocorrencias-tab'
import { CupomDescontoPagamentosTab } from '@/src/features/cupons-desconto/components/cupom-desconto-pagamentos-tab'
import { CupomDescontoUniversosTab } from '@/src/features/cupons-desconto/components/cupom-desconto-universos-tab'
import { cuponsDescontoClient } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { CUPONS_DESCONTO_CONFIG } from '@/src/features/cupons-desconto/services/cupons-desconto-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function CupomDescontoFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={CUPONS_DESCONTO_CONFIG}
      client={cuponsDescontoClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('marketing.coupons.tabs.general', 'Dados gerais'),
          icon: <TicketPercent className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'usage-conditions',
          label: t('marketing.coupons.tabs.usageConditions.title', 'Condições de uso'),
          icon: <ScanSearch className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: couponId, readOnly, onFeedback }) => couponId ? (
            <CupomDescontoUniversosTab cupomId={couponId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'application',
          label: t('marketing.coupons.tabs.application.title', 'Aplicação do cupom'),
          icon: <Gift className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: couponId, readOnly, onFeedback }) => couponId ? (
            <CupomDescontoOcorrenciasTab cupomId={couponId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'payments',
          label: t('marketing.coupons.tabs.payments.title', 'Formas e condições de pagamento'),
          icon: <CircleDollarSign className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: couponId, readOnly, onFeedback }) => couponId ? (
            <CupomDescontoPagamentosTab cupomId={couponId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
      ]}
    />
  )
}
