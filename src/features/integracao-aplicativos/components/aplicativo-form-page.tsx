'use client'

import type { CrudDataClient, CrudRecord } from '@/src/components/crud-base/types'
import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import {
  INTEGRACAO_APLICATIVOS_CONFIG,
} from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-config'
import type { AplicativoIntegracaoListFilters } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'
import { integracaoAplicativosClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-client'

const aplicativoFormClient: CrudDataClient = {
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

export function AplicativoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={INTEGRACAO_APLICATIVOS_CONFIG} client={aplicativoFormClient} id={id} />
}

