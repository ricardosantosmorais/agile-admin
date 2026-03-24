'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CatalogProductRelation } from '@/src/features/catalog/types/catalog-relations'

const baseClient = createCrudClient('/api/colecoes')

export const colecoesClient = {
  ...baseClient,
  createProducts(id: string, items: Array<Pick<CatalogProductRelation, 'id_produto' | 'id_tabela_preco' | 'posicao'>>) {
    return httpClient(`/api/colecoes/${id}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
  deleteProducts(id: string, items: Array<Pick<CatalogProductRelation, 'id_produto' | 'id_tabela_preco'>>) {
    return httpClient(`/api/colecoes/${id}/produtos`, {
      method: 'DELETE',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
}
