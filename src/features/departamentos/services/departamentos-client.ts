import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CatalogUniverseRecord } from '@/src/features/catalog/types/catalog-relations'

const baseClient = createCrudClient('/api/departamentos')

export const departamentosClient = {
  ...baseClient,
  createUniverse(id: string, payload: Partial<CatalogUniverseRecord> & Record<string, unknown>) {
    return httpClient(`/api/departamentos/${id}/universos`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteUniverses(id: string, ids: string[]) {
    return httpClient(`/api/departamentos/${id}/universos`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
}
