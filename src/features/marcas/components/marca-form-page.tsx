'use client'

import { Eye, PencilLine, Search } from 'lucide-react'
import { CatalogUniversosTab } from '@/src/features/catalog/components/catalog-universos-tab'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { marcasClient } from '@/src/features/marcas/services/marcas-client'
import { MARCAS_CONFIG } from '@/src/features/marcas/services/marcas-config'
import type { CrudRecord } from '@/src/components/crud-base/types'

function getUniverses(form: CrudRecord) {
  return Array.isArray(form.universos) ? form.universos : []
}

export function MarcaFormPage({ id }: { id?: string }) {
  return (
    <TabbedCatalogFormPage
      config={MARCAS_CONFIG}
      client={marcasClient}
      id={id}
      formEmbed="universos.canal_distribuicao,universos.filial,universos.grupo,universos.rede,universos.segmento,universos.tabela_preco"
      tabs={[
        {
          key: 'general',
          label: 'Dados gerais',
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'seo',
          label: 'SEO',
          icon: <Search className="h-4 w-4" />,
          sectionIds: ['seo'],
        },
        {
          key: 'display',
          label: 'Exibição',
          icon: <Eye className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <CatalogUniversosTab
              entityId={recordId}
              entityType="marcas"
              readOnly={readOnly}
              items={getUniverses(form)}
              onRefresh={refreshRecord}
              onError={onFeedback}
              createUniverse={marcasClient.createUniverse}
              deleteUniverses={marcasClient.deleteUniverses}
            />
          ) : null,
        },
      ]}
    />
  )
}
