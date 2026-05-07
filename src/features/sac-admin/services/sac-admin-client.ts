import { normalizeSacDashboard, normalizeSacTicketDetail, normalizeSacTicketListResponse } from '@/src/features/sac-admin/services/sac-admin-mappers'
import type {
  SacRawDashboardResponse,
  SacRawTicketDetailResponse,
  SacRawTicketListResponse,
  SacTicketAction,
} from '@/src/features/sac-admin/types/sac-admin'
import { httpClient } from '@/src/services/http/http-client'

export type SacTicketListFilters = {
  page?: number
  perpage?: number
  status?: string
  cliente?: string
  protocolo?: string
  data_inicial?: string
  data_final?: string
}

export type SacDashboardFilters = {
  data_inicial?: string
  data_final?: string
  id_usuario_responsavel?: string
}

function buildQuery(filters: Record<string, string | number | undefined>, defaults: Record<string, string | number> = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(defaults)) {
    params.set(key, String(value))
  }
  for (const [key, value] of Object.entries(filters)) {
    const normalized = String(value ?? '').trim()
    if (normalized) params.set(key, normalized)
  }
  return params.toString()
}

export const sacAdminClient = {
  async dashboard(filters: SacDashboardFilters) {
    const query = buildQuery(filters)
    const response = await httpClient<SacRawDashboardResponse>(`/api/sac/dashboard${query ? `?${query}` : ''}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeSacDashboard(response)
  },
  async list(filters: SacTicketListFilters) {
    const response = await httpClient<SacRawTicketListResponse>(`/api/sac/chamados?${buildQuery(filters, { page: 1, perpage: 15 })}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeSacTicketListResponse(response)
  },
  async detail(id: string) {
    const response = await httpClient<SacRawTicketDetailResponse>(`/api/sac/chamados/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeSacTicketDetail(response)
  },
  async action(id: string, action: SacTicketAction, payload: Record<string, unknown>) {
    return httpClient(`/api/sac/chamados/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ action, ...payload }),
    })
  },
}
