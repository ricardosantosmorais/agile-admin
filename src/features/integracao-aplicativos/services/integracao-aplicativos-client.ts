'use client'

import { httpClient } from '@/src/services/http/http-client'
import { asArray, asRecord, asString } from '@/src/lib/api-payload'
import {
  mapAplicativoIntegracaoDetail,
  mapAplicativoIntegracaoListResponse,
  mapAplicativoIntegracaoPermissoesResponse,
  toAplicativoIntegracaoPayload,
  type AplicativoIntegracaoFormRecord,
  type AplicativoIntegracaoListFilters,
} from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'

function buildListParams(filters: AplicativoIntegracaoListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
    orderBy: filters.orderBy,
    sort: filters.sort,
  })

  for (const [key, value] of Object.entries(filters)) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) {
      continue
    }

    if (typeof value === 'string' && value.trim()) {
      params.set(key, value)
    }
  }

  return params
}

export const integracaoAplicativosClient = {
  async list(filters: AplicativoIntegracaoListFilters) {
    const response = await httpClient<unknown>(`/api/integracao-aplicativos?${buildListParams(filters).toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapAplicativoIntegracaoListResponse(response)
  },

  async getById(id: string) {
    const response = await httpClient<unknown>(`/api/integracao-aplicativos/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapAplicativoIntegracaoDetail(response)
  },

  async save(form: AplicativoIntegracaoFormRecord) {
    const response = await httpClient<unknown>(`/api/integracao-aplicativos`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(toAplicativoIntegracaoPayload(form)),
    })

    const responseRecord = asRecord(response)
    const responseArray = asArray<Record<string, unknown>>(response)
    const firstArrayItem = asRecord(responseArray[0])
    const responseData = asRecord(responseRecord.data)

    return {
      id: asString(
        responseRecord.id
        ?? firstArrayItem.id
        ?? responseData.id
        ?? form.id,
      ),
    }
  },

  async delete(ids: string[]) {
    await httpClient('/api/integracao-aplicativos', {
      method: 'DELETE',
      cache: 'no-store',
      body: JSON.stringify({ ids }),
    })
  },

  async refreshSecret(id: string) {
    await httpClient(`/api/integracao-aplicativos/${id}/secret`, {
      method: 'POST',
      cache: 'no-store',
    })
  },

  async getPermissoes(id: string) {
    const response = await httpClient<unknown>(`/api/integracao-aplicativos/${id}/permissoes`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapAplicativoIntegracaoPermissoesResponse(response)
  },

  async savePermissoes(id: string, rows: Array<{
    tabelaNome: string
    verboGet: boolean
    verboSalvar: boolean
    verboDelete: boolean
  }>) {
    await httpClient(`/api/integracao-aplicativos/${id}/permissoes`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ rows }),
    })
  },
}
