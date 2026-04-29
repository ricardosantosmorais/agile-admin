import type { CrudDataClient, CrudOption } from '@/src/components/crud-base/types'
import { agileAdministradoresClient } from '@/src/features/agile-administradores/services/agile-administradores-client'
import type { AgileAdministradorListFilters } from '@/src/features/agile-administradores/services/agile-administradores-mappers'

export const agileAdministradoresCrudClient: CrudDataClient = {
  list(filters) {
    return agileAdministradoresClient.list(filters as AgileAdministradorListFilters)
  },
  async getById(id) {
    return agileAdministradoresClient.getById(id)
  },
  save(payload) {
    return agileAdministradoresClient.save(payload)
  },
  delete(ids) {
    return agileAdministradoresClient.delete(ids)
  },
  async listOptions(resource) {
    if (resource !== 'perfis_administradores') {
      return [] satisfies CrudOption[]
    }

    const profiles = await agileAdministradoresClient.loadPerfilOptions('', 1, 1000)
    return profiles.map((profile) => ({ value: profile.id, label: profile.label }))
  },
}
