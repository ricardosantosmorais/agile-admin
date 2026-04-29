'use client'

import { Building2, FileText } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { AgileAdministradorEmpresasTab } from '@/src/features/agile-administradores/components/agile-administrador-empresas-tab'
import { agileAdministradoresCrudClient } from '@/src/features/agile-administradores/services/agile-administradores-crud-client'
import { AGILE_ADMINISTRADORES_CONFIG } from '@/src/features/agile-administradores/services/agile-administradores-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function AgileAdministradorFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={AGILE_ADMINISTRADORES_CONFIG}
      client={agileAdministradoresCrudClient}
      id={id}
      tabs={[
        {
          key: 'dados',
          label: t('basicRegistrations.sections.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'empresas',
          label: t('administradores.companies.tab', 'Empresas'),
          icon: <Building2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => (
            <AgileAdministradorEmpresasTab
              id={recordId}
              form={form}
              readOnly={readOnly}
              refreshRecord={refreshRecord}
              onFeedback={onFeedback}
            />
          ),
        },
      ]}
    />
  )
}
