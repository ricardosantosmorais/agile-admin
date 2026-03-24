'use client'

import { Eye, PencilLine } from 'lucide-react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { CatalogUniversosTab } from '@/src/features/catalog/components/catalog-universos-tab'
import { notificacoesAppClient } from '@/src/features/notificacoes-app/services/notificacoes-app-client'
import { NOTIFICACOES_APP_CONFIG } from '@/src/features/notificacoes-app/services/notificacoes-app-config'
import { useI18n } from '@/src/i18n/use-i18n'

function getUniverses(form: CrudRecord) {
  return Array.isArray(form.universos) ? form.universos : []
}

export function NotificacoesAppFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={NOTIFICACOES_APP_CONFIG}
      client={notificacoesAppClient}
      id={id}
      formEmbed="universos.canal_distribuicao,universos.filial,universos.grupo,universos.rede,universos.segmento,universos.tabela_preco"
      tabs={[
        {
          key: 'general',
          label: t('marketing.notifications.tabs.general', 'Dados gerais'),
          icon: <PencilLine className="h-4 w-4" />,
          render: ({ config, form, optionsMap, patch, readOnly }) => (
            <CrudFormSections
              config={config}
              form={form}
              readOnly={readOnly}
              patch={patch}
              optionsMap={optionsMap}
            />
          ),
        },
        {
          key: 'display',
          label: t('marketing.notifications.tabs.segmentation', 'Segmentação'),
          icon: <Eye className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <CatalogUniversosTab
              entityId={recordId}
              entityType="notificacoes"
              readOnly={readOnly}
              items={getUniverses(form)}
              onRefresh={refreshRecord}
              onError={onFeedback}
              createUniverse={notificacoesAppClient.createUniverse}
              deleteUniverses={notificacoesAppClient.deleteUniverses}
            />
          ) : null,
        },
      ]}
    />
  )
}
