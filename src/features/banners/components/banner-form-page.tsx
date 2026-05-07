'use client'

import { Eye, Link2, PencilLine } from 'lucide-react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { CatalogUniversosTab } from '@/src/features/catalog/components/catalog-universos-tab'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { BannerGeneralTab } from '@/src/features/banners/components/banner-general-tab'
import { BannerUrlsTab } from '@/src/features/banners/components/banner-urls-tab'
import { bannersClient } from '@/src/features/banners/services/banners-client'
import { BANNERS_CONFIG } from '@/src/features/banners/services/banners-config'
import { useI18n } from '@/src/i18n/use-i18n'

function getUniverses(form: CrudRecord) {
  return Array.isArray(form.universos) ? form.universos : []
}

export function BannerFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={BANNERS_CONFIG}
      client={bannersClient}
      id={id}
      formEmbed="area,universos.canal_distribuicao,universos.colecao,universos.departamento,universos.filial,universos.fornecedor,universos.grupo,universos.marca,universos.rede,universos.segmento,universos.tabela_preco,urls"
      tabs={[
        {
          key: 'general',
          label: t('marketing.banners.tabs.general', 'Dados gerais'),
          icon: <PencilLine className="h-4 w-4" />,
          render: ({ form, config, optionsMap, readOnly, patch }) => (
            <BannerGeneralTab
              config={config}
              form={form}
              readOnly={readOnly}
              optionsMap={optionsMap}
              patch={patch}
            />
          ),
        },
        {
          key: 'display',
          label: t('marketing.banners.tabs.display', 'Exibição'),
          icon: <Eye className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <CatalogUniversosTab
              entityId={recordId}
              entityType="banners"
              readOnly={readOnly}
              items={getUniverses(form)}
              onRefresh={refreshRecord}
              onError={onFeedback}
              createUniverse={bannersClient.createUniverse}
              deleteUniverses={bannersClient.deleteUniverses}
            />
          ) : null,
        },
        {
          key: 'urls',
          label: t('marketing.banners.tabs.urls', 'URLs'),
          icon: <Link2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <BannerUrlsTab
              entityId={recordId}
              readOnly={readOnly}
              form={form}
              onRefresh={refreshRecord}
              onError={onFeedback}
            />
          ) : null,
        },
      ]}
    />
  )
}
