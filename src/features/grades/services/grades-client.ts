import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { GradeValueRecord } from '@/src/features/catalog/types/catalog-relations'

const baseClient = createCrudClient('/api/grades')

export const gradesClient = {
  ...baseClient,
  saveValue(id: string, payload: Partial<GradeValueRecord>) {
    return httpClient(`/api/grades/${id}/valores`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  reorderValues(id: string, payload: Array<Partial<GradeValueRecord>>) {
    return httpClient(`/api/grades/${id}/valores`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteValues(id: string, ids: string[]) {
    return httpClient(`/api/grades/${id}/valores`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
}
