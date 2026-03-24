'use client'

import type { CrudDataClient, CrudOption, CrudRecord } from '@/src/components/crud-base/types'
import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { ADMINISTRADORES_CONFIG } from '@/src/features/administradores/services/administradores-config'
import type { AdminListFilters } from '@/src/features/administradores/services/administradores-mappers'
import { administradoresClient } from '@/src/features/administradores/services/administradores-client'

const administradoresFormClient: CrudDataClient = {
  async list(filters) {
    return administradoresClient.list(filters as AdminListFilters)
  },
  async getById(id) {
    const record = await administradoresClient.getById(id)
    return (record ?? {}) as CrudRecord
  },
  async save(payload) {
    const result = await administradoresClient.save(payload as never)
    return [{ id: result.id }]
  },
  delete: async (ids) => {
    await administradoresClient.delete(ids)
    return { success: true }
  },
  async listOptions(resource) {
    if (resource !== 'perfis_administradores') {
      return [] satisfies CrudOption[]
    }

    const profiles = await administradoresClient.listPerfis()
    return profiles.map((profile) => ({
      value: profile.id,
      label: profile.nome,
    }))
  },
}

export function AdministradorFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={ADMINISTRADORES_CONFIG} client={administradoresFormClient} id={id} />
}
