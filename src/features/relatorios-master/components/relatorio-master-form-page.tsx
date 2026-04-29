'use client'

import { Code2, FileBarChart2, ListChecks } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { RelatorioMappingTab } from '@/src/features/relatorios-master/components/relatorio-mapping-tab'
import { RelatorioQueryTab } from '@/src/features/relatorios-master/components/relatorio-query-tab'
import { relatoriosMasterClient } from '@/src/features/relatorios-master/services/relatorios-master-client'
import { RELATORIOS_MASTER_CONFIG } from '@/src/features/relatorios-master/services/relatorios-master-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function RelatorioMasterFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={RELATORIOS_MASTER_CONFIG}
      client={relatoriosMasterClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('catalog.tabs.general', 'Dados gerais'),
          icon: <FileBarChart2 className="h-4 w-4" />,
          sectionIds: ['main'],
        },
        {
          key: 'query',
          label: t('maintenance.reportsMaster.tabs.query', 'Query'),
          icon: <Code2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ form, readOnly, patch, onFeedback }) => <RelatorioQueryTab form={form} readOnly={readOnly} patch={patch} onFeedback={onFeedback} />,
        },
        {
          key: 'mapping',
          label: t('maintenance.reportsMaster.tabs.mapping', 'Mapeamento'),
          icon: <ListChecks className="h-4 w-4" />,
          hidden: ({ isEditing, form }) => !isEditing || !String(form.id_query ?? '').trim(),
          render: ({ form, readOnly, onFeedback }) => <RelatorioMappingTab form={form} readOnly={readOnly} onFeedback={onFeedback} />,
        },
      ]}
    />
  )
}
