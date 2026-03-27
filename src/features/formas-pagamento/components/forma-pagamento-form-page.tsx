'use client'

import { FileText, LockKeyhole, ShieldBan, WalletCards } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { FormaPagamentoCondicoesTab } from '@/src/features/formas-pagamento/components/forma-pagamento-condicoes-tab'
import { FormaPagamentoOcorrenciasTab } from '@/src/features/formas-pagamento/components/forma-pagamento-ocorrencias-tab'
import { FORMAS_PAGAMENTO_CONFIG } from '@/src/features/formas-pagamento/services/formas-pagamento-config'
import { formasPagamentoClient } from '@/src/features/formas-pagamento/services/formas-pagamento-client'
import { useI18n } from '@/src/i18n/use-i18n'

export function FormaPagamentoFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={FORMAS_PAGAMENTO_CONFIG}
      client={formasPagamentoClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('financial.paymentMethods.tabs.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['flags', 'basic', 'instructions'],
        },
        {
          key: 'conditions',
          label: t('financial.paymentMethods.tabs.conditions', 'Condições de pagamento'),
          icon: <WalletCards className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaPagamentoId, form, readOnly, refreshRecord, onFeedback }) => formaPagamentoId ? (
            <FormaPagamentoCondicoesTab
              formaPagamentoId={formaPagamentoId}
              items={Array.isArray(form.condicoes_pagamento) ? form.condicoes_pagamento as never[] : []}
              readOnly={readOnly}
              onRefresh={refreshRecord}
              onError={onFeedback}
            />
          ) : null,
        },
        {
          key: 'restrictions',
          label: t('financial.paymentMethods.tabs.restrictions', 'Restrições'),
          icon: <ShieldBan className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaPagamentoId, readOnly, onFeedback }) => formaPagamentoId ? (
            <FormaPagamentoOcorrenciasTab mode="restricoes" formaPagamentoId={formaPagamentoId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'exceptions',
          label: t('financial.paymentMethods.tabs.exceptions', 'Exceções'),
          icon: <LockKeyhole className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaPagamentoId, readOnly, onFeedback }) => formaPagamentoId ? (
            <FormaPagamentoOcorrenciasTab mode="excecoes" formaPagamentoId={formaPagamentoId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
      ]}
    />
  )
}
