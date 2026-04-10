import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CatalogProductRelation } from '@/src/features/catalog/types/catalog-relations'

const baseClient = createCrudClient('/api/listas')

export const listasClient = {
  ...baseClient,
  createProducts(id: string, items: Array<Pick<CatalogProductRelation, 'id_produto' | 'quantidade' | 'posicao'>>) {
    return httpClient(`/api/listas/${id}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
  deleteProducts(id: string, items: Array<Pick<CatalogProductRelation, 'id_produto'>>) {
    return httpClient(`/api/listas/${id}/produtos`, {
      method: 'DELETE',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
}
