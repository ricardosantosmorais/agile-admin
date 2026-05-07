import { httpClient } from '@/src/services/http/http-client'
import { normalizeAgileStoreDetail, normalizeAgileStoreListResponse } from '@/src/features/agile-store/services/agile-store-mappers'
import type { AgileStoreAction, AgileStoreRawListResponse, AgileStoreRawModule } from '@/src/features/agile-store/types/agile-store'

export type AgileStoreListFilters = {
  page?: number
  perpage?: number
  q?: string
  tipo?: string
  status?: string
}

function buildQuery(filters: AgileStoreListFilters) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page ?? 1))
  params.set('perpage', String(filters.perpage ?? 12))
  for (const key of ['q', 'tipo', 'status'] as const) {
    const value = String(filters[key] ?? '').trim()
    if (value) params.set(key, value)
  }
  return params.toString()
}

export const agileStoreClient = {
  async list(filters: AgileStoreListFilters) {
    const response = await httpClient<AgileStoreRawListResponse>(`/api/agile-store?${buildQuery(filters)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeAgileStoreListResponse(response)
  },
  async detail(id: string) {
    const response = await httpClient<AgileStoreRawModule>(`/api/agile-store/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeAgileStoreDetail(response)
  },
  async action(id: string, action: AgileStoreAction) {
    return httpClient(`/api/agile-store/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ action }),
    })
  },
}
