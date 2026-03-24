'use client'

import { Boxes, PencilLine } from 'lucide-react'
import { CatalogProductsTab } from '@/src/features/catalog/components/catalog-products-tab'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { listasClient } from '@/src/features/listas/services/listas-client'
import { LISTAS_CONFIG } from '@/src/features/listas/services/listas-config'
import type { CrudRecord } from '@/src/components/crud-base/types'

function getProducts(form: CrudRecord) {
  return Array.isArray(form.produtos) ? form.produtos : []
}

export function ListaFormPage({ id }: { id?: string }) {
  return (
    <TabbedCatalogFormPage
      config={LISTAS_CONFIG}
      client={listasClient}
      id={id}
      formEmbed="produtos.produto"
      tabs={[
        {
          key: 'general',
          label: 'Dados gerais',
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'products',
          label: 'Produtos',
          icon: <Boxes className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <CatalogProductsTab
              mode="listas"
              entityId={recordId}
              readOnly={readOnly}
              items={getProducts(form)}
              onRefresh={refreshRecord}
              onError={onFeedback}
              createProducts={listasClient.createProducts}
              deleteProducts={listasClient.deleteProducts}
            />
          ) : null,
        },
      ]}
    />
  )
}
