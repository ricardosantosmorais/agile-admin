'use client'

import { httpClient } from '@/src/services/http/http-client'
import type {
  AdminFormRecord,
  AdminListFilters,
  AdminListResponse,
  AdminPasswordRecord,
  AdminProfileOption,
} from '@/src/features/administradores/services/administradores-mappers'
import {
  mapAdminDetail,
  mapAdminListResponse,
  mapAdminPasswordDetail,
  toAdminPayload,
} from '@/src/features/administradores/services/administradores-mappers'

function buildListParams(filters: AdminListFilters) {
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

export const administradoresClient = {
  async list(filters: AdminListFilters): Promise<AdminListResponse> {
    const params = buildListParams(filters)
    const response = await httpClient<unknown>(`/api/administradores?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapAdminListResponse(response)
  },

  async getById(id: string): Promise<AdminFormRecord | null> {
    const response = await httpClient<unknown>(`/api/administradores/${id}?embed=perfil`, {
      method: 'GET',
      cache: 'no-store',
    })

    return response ? mapAdminDetail(response) : null
  },

  async getPasswordById(id: string): Promise<AdminPasswordRecord | null> {
    const response = await httpClient<unknown>(`/api/administradores/${id}?embed=perfil`, {
      method: 'GET',
      cache: 'no-store',
    })

    return response ? mapAdminPasswordDetail(response) : null
  },

  async listPerfis(): Promise<AdminProfileOption[]> {
    const response = await httpClient<{ data: Array<Record<string, unknown>> }>(`/api/administradores/perfis`, {
      method: 'GET',
      cache: 'no-store',
    })

    return Array.isArray(response.data)
      ? response.data.map((item) => ({
          id: String(item.id || ''),
          nome: String(item.nome || ''),
        }))
      : []
  },

  async save(payload: AdminFormRecord): Promise<{ id: string }> {
    const response = await httpClient<Array<Record<string, unknown>>>(`/api/administradores`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(toAdminPayload(payload)),
    })

    return { id: String(response[0]?.id || payload.id || '') }
  },

  async delete(ids: string[]): Promise<void> {
    await httpClient(`/api/administradores`, {
      method: 'DELETE',
      cache: 'no-store',
      body: JSON.stringify({ ids }),
    })
  },

  async changePassword(payload: AdminPasswordRecord): Promise<void> {
    await httpClient(`/api/administradores/password`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({
        id: payload.id,
        senha: payload.senha,
        confirmacao: payload.confirmacao,
      }),
    })
  },
}
