'use client'

import { httpClient } from '@/src/services/http/http-client'
import {
  mapPerfilDetail,
  mapPerfilListResponse,
  mapPerfilPermissionTree,
  toPerfilPayload,
  type PerfilFormRecord,
  type PerfilListFilters,
} from '@/src/features/perfis/services/perfis-mappers'

function buildListParams(filters: PerfilListFilters) {
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

export const perfisClient = {
  async list(filters: PerfilListFilters) {
    const response = await httpClient<unknown>(`/api/perfis?${buildListParams(filters).toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapPerfilListResponse(response)
  },

  async getById(id: string) {
    const response = await httpClient<unknown>(`/api/perfis/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapPerfilDetail(response)
  },

  async getPermissionTree(id?: string) {
    const query = id ? `?idPerfil=${encodeURIComponent(id)}` : ''
    const response = await httpClient<unknown>(`/api/perfis/acessos${query}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapPerfilPermissionTree(response)
  },

  async save(form: PerfilFormRecord, nodes: Parameters<typeof toPerfilPayload>[1]) {
    const response = await httpClient<Array<Record<string, unknown>>>(`/api/perfis`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(toPerfilPayload(form, nodes)),
    })

    return { id: String(response[0]?.id || form.id || '') }
  },

  async delete(ids: string[]) {
    await httpClient(`/api/perfis`, {
      method: 'DELETE',
      cache: 'no-store',
      body: JSON.stringify({ ids }),
    })
  },
}
