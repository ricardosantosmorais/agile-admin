import type { CrudDataClient, CrudRecord } from '@/src/components/crud-base/types'
import { integracaoAplicativosClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-client'
import type { AplicativoIntegracaoListFilters } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'

export const integracaoAplicativosCrudClient: CrudDataClient = {
  async list(filters) {
    return integracaoAplicativosClient.list(filters as AplicativoIntegracaoListFilters)
  },
  async getById(id) {
    const record = await integracaoAplicativosClient.getById(id)
    return (record ?? {}) as CrudRecord
  },
  async save(payload) {
    const result = await integracaoAplicativosClient.save(payload as never)
    return [{ id: result.id }]
  },
  delete: async (ids) => {
    await integracaoAplicativosClient.delete(ids)
    return { success: true }
  },
  async listOptions() {
    return []
  },
}
