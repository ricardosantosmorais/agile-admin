import { httpClient } from '@/src/services/http/http-client'
import { normalizeAgileStoreAdminDashboard } from '@/src/features/agile-store/services/agile-store-admin-mappers'
import { normalizeAgileStoreDetail, normalizeAgileStoreListResponse } from '@/src/features/agile-store/services/agile-store-mappers'
import type { AgileStoreAction, AgileStoreActionFeedback, AgileStoreAdminDashboardRawResponse, AgileStoreRawDetailResponse, AgileStoreRawListResponse } from '@/src/features/agile-store/types/agile-store'

export type AgileStoreListFilters = {
  page?: number
  perpage?: number
  q?: string
  tipo?: string
  status?: string
}

export type AgileStoreAdminDashboardFilters = {
  escopo?: string
  inicio?: string
  fim?: string
  id_modulo?: string
  faturamento_status?: string
  q?: string
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

function buildAdminQuery(filters: AgileStoreAdminDashboardFilters) {
  const params = new URLSearchParams()
  params.set('escopo', filters.escopo || 'periodo')
  for (const key of ['inicio', 'fim', 'id_modulo', 'faturamento_status', 'q'] as const) {
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
    const response = await httpClient<AgileStoreRawDetailResponse>(`/api/agile-store/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeAgileStoreDetail(response)
  },
  async action(id: string, action: AgileStoreAction, feedback?: AgileStoreActionFeedback) {
    return httpClient(`/api/agile-store/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ action, feedback }),
    })
  },
  async adminDashboard(filters: AgileStoreAdminDashboardFilters) {
    const response = await httpClient<AgileStoreAdminDashboardRawResponse>(`/api/agile-store/admin/dashboard?${buildAdminQuery(filters)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeAgileStoreAdminDashboard(response)
  },
  async adminUpdateBillingStatus(id: string, status: string) {
    return httpClient(`/api/agile-store/admin/contratacoes/${encodeURIComponent(id)}/faturamento`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ status }),
    })
  },
  async adminCancelContract(id: string) {
    return httpClient(`/api/agile-store/admin/contratacoes/${encodeURIComponent(id)}/descontratar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },
}
