'use client'

import { Building2, FileText } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { NotificacaoPainelEmpresasTab } from '@/src/features/notificacoes-painel/components/notificacao-painel-empresas-tab'
import { notificacoesPainelClient } from '@/src/features/notificacoes-painel/services/notificacoes-painel-client'
import { NOTIFICACOES_PAINEL_CONFIG } from '@/src/features/notificacoes-painel/services/notificacoes-painel-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function NotificacaoPainelFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={NOTIFICACOES_PAINEL_CONFIG}
      client={notificacoesPainelClient}
      id={id}
      formEmbed="empresas.empresa"
      tabs={[
        {
          key: 'dados',
          label: t('basicRegistrations.sections.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'empresas',
          label: t('panelNotifications.companies.tab', 'Empresas'),
          icon: <Building2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => (
            <NotificacaoPainelEmpresasTab
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
