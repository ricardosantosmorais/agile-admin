'use client'

import { Boxes, PencilLine } from 'lucide-react'
import { CatalogProductsTab } from '@/src/features/catalog/components/catalog-products-tab'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { colecoesClient } from '@/src/features/colecoes/services/colecoes-client'
import { COLECOES_CONFIG } from '@/src/features/colecoes/services/colecoes-config'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { useI18n } from '@/src/i18n/use-i18n'

function getProducts(form: CrudRecord) {
  return Array.isArray(form.produtos) ? form.produtos : []
}

export function ColecaoFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={COLECOES_CONFIG}
      client={colecoesClient}
      id={id}
      formEmbed="filial,produtos.produto,produtos.tabela_preco"
      tabs={[
        {
          key: 'general',
          label: t('catalog.colecoes.tabs.general', 'Dados gerais'),
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'products',
          label: t('catalog.colecoes.tabs.products', 'Produtos'),
          icon: <Boxes className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <CatalogProductsTab
              mode="colecoes"
              entityId={recordId}
              readOnly={readOnly}
              items={getProducts(form)}
              onRefresh={refreshRecord}
              onError={onFeedback}
              createProducts={colecoesClient.createProducts}
              deleteProducts={colecoesClient.deleteProducts}
            />
          ) : null,
        },
      ]}
    />
  )
}
