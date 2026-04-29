import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { CrudDataClient, CrudRecord } from '@/src/components/crud-base/types'
import { httpClient } from '@/src/services/http/http-client'

type ComponentesClient = CrudDataClient & {
  saveCampo: (payload: CrudRecord) => Promise<CrudRecord[]>
  deleteCampos: (ids: string[]) => Promise<{ success: true }>
  reorderCampos: (campos: Array<{ id: string; posicao: number }>) => Promise<CrudRecord[]>
}

export const componentesClient: ComponentesClient = {
  ...createCrudClient('/api/componentes'),
  saveCampo(payload) {
    return httpClient<CrudRecord[]>('/api/componentes-campos', {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteCampos(ids) {
    return httpClient<{ success: true }>('/api/componentes-campos', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  reorderCampos(campos) {
    return httpClient<CrudRecord[]>('/api/componentes-campos', {
      method: 'POST',
      body: JSON.stringify(campos),
      cache: 'no-store',
    })
  },
}
