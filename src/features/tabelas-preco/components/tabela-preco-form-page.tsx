'use client'

import { Building2, FileText } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { TabelasPrecoFiliaisTab } from '@/src/features/tabelas-preco/components/tabelas-preco-filiais-tab'
import { tabelasPrecoClient } from '@/src/features/tabelas-preco/services/tabelas-preco-client'
import { TABELAS_PRECO_CONFIG } from '@/src/features/tabelas-preco/services/tabelas-preco-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function TabelaPrecoFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={TABELAS_PRECO_CONFIG}
      client={tabelasPrecoClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('financial.priceTables.tabs.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'branches',
          label: t('financial.priceTables.tabs.branches', 'Filiais'),
          icon: <Building2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: tabelaPrecoId, form, readOnly, refreshRecord, onFeedback }) => tabelaPrecoId ? (
            <TabelasPrecoFiliaisTab
              tabelaPrecoId={tabelaPrecoId}
              items={Array.isArray(form.filiais) ? form.filiais as never[] : []}
              readOnly={readOnly}
              onRefresh={refreshRecord}
              onError={onFeedback}
            />
          ) : null,
        },
      ]}
    />
  )
}
