'use client'

import { Building2, FileText, LockKeyhole, ShieldBan } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { CondicoesPagamentoFiliaisTab } from '@/src/features/condicoes-pagamento/components/condicoes-pagamento-filiais-tab'
import { CondicoesPagamentoOcorrenciasTab } from '@/src/features/condicoes-pagamento/components/condicoes-pagamento-ocorrencias-tab'
import { condicoesPagamentoClient } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-client'
import { CONDICOES_PAGAMENTO_CONFIG } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function CondicaoPagamentoFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={CONDICOES_PAGAMENTO_CONFIG}
      client={condicoesPagamentoClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('financial.paymentTerms.tabs.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['flags', 'basic', 'pricing'],
        },
        {
          key: 'branches',
          label: t('financial.paymentTerms.tabs.branches', 'Filiais'),
          icon: <Building2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: condicaoPagamentoId, form, readOnly, refreshRecord, onFeedback }) => condicaoPagamentoId ? (
            <CondicoesPagamentoFiliaisTab
              condicaoPagamentoId={condicaoPagamentoId}
              items={Array.isArray(form.filiais) ? form.filiais as never[] : []}
              readOnly={readOnly}
              onRefresh={refreshRecord}
              onError={onFeedback}
            />
          ) : null,
        },
        {
          key: 'restrictions',
          label: t('financial.paymentTerms.tabs.restrictions', 'Restrições'),
          icon: <ShieldBan className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: condicaoPagamentoId, readOnly, onFeedback }) => condicaoPagamentoId ? (
            <CondicoesPagamentoOcorrenciasTab mode="restricoes" condicaoPagamentoId={condicaoPagamentoId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'exceptions',
          label: t('financial.paymentTerms.tabs.exceptions', 'Exceções'),
          icon: <LockKeyhole className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: condicaoPagamentoId, readOnly, onFeedback }) => condicaoPagamentoId ? (
            <CondicoesPagamentoOcorrenciasTab mode="excecoes" condicaoPagamentoId={condicaoPagamentoId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
      ]}
    />
  )
}
