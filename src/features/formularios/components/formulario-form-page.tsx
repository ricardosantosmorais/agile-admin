'use client'

import { ClipboardList, FileText } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { FormularioCamposTab } from '@/src/features/formularios/components/formulario-campos-tab'
import { formulariosClient } from '@/src/features/formularios/services/formularios-client'
import { FORMULARIOS_CONFIG } from '@/src/features/formularios/services/formularios-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function FormularioFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={FORMULARIOS_CONFIG}
      client={formulariosClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('maintenance.forms.tabs.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['main'],
        },
        {
          key: 'fields',
          label: t('maintenance.forms.tabs.fields', 'Campos'),
          icon: <ClipboardList className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formularioId, readOnly, onFeedback }) => formularioId ? (
            <FormularioCamposTab
              formularioId={formularioId}
              readOnly={readOnly}
              onError={onFeedback}
            />
          ) : null,
        },
      ]}
    />
  )
}
