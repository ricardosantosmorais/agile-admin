import type { CrudDataClient, CrudRecord } from '@/src/components/crud-base/types'
import { perfisClient } from '@/src/features/perfis/services/perfis-client'
import type { PerfilListFilters } from '@/src/features/perfis/services/perfis-mappers'

export const perfisCrudClient: CrudDataClient = {
  async list(filters) {
    return perfisClient.list(filters as PerfilListFilters)
  },
  async getById(id) {
    return await perfisClient.getById(id) as CrudRecord
  },
  async save(payload) {
    const result = await perfisClient.save(payload as never, [])
    return [{ id: result.id }]
  },
  delete: async (ids) => {
    await perfisClient.delete(ids)
    return { success: true }
  },
  async listOptions() {
    return []
  },
}
