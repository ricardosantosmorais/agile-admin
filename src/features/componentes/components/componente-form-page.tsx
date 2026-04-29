'use client'

import { Film, ListChecks } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { ComponenteCamposTab } from '@/src/features/componentes/components/componente-campos-tab'
import { componentesClient } from '@/src/features/componentes/services/componentes-client'
import { COMPONENTES_CONFIG } from '@/src/features/componentes/services/componentes-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function ComponenteFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={COMPONENTES_CONFIG}
      client={componentesClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('catalog.tabs.general', 'Dados gerais'),
          icon: <Film className="h-4 w-4" />,
          sectionIds: ['main'],
        },
        {
          key: 'fields',
          label: t('registrations.components.tabs.fields', 'Campos'),
          icon: <ListChecks className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ form, readOnly, refreshRecord, onFeedback }) => (
            <ComponenteCamposTab form={form} readOnly={readOnly} refreshRecord={refreshRecord} onFeedback={onFeedback} />
          ),
        },
      ]}
    />
  )
}
