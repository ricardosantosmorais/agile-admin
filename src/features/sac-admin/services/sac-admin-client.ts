import { normalizeSacAreaResponsibles, normalizeSacAreas, normalizeSacDashboard, normalizeSacLookupOptions, normalizeSacModuleConfig, normalizeSacSubjects, normalizeSacTicketDetail, normalizeSacTicketListResponse } from '@/src/features/sac-admin/services/sac-admin-mappers'
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
  id_sac_area?: string
  id_sac_assunto?: string
  id_usuario_responsavel?: string
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
  async respond(id: string, payload: Record<string, unknown>, attachments: File[] = []) {
    const formData = new FormData()
    formData.set('action', 'respond')
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) formData.set(key, String(value))
    }
    for (const file of attachments) {
      formData.append('anexos[]', file)
    }
    return httpClient(`/api/sac/chamados/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      cache: 'no-store',
      body: formData,
    })
  },
  async areas() {
    return normalizeSacAreas(await httpClient<{ data?: Array<Record<string, unknown>> }>('/api/sac/areas', {
      method: 'GET',
      cache: 'no-store',
    }))
  },
  async subjects(areaId?: string) {
    const query = buildQuery({ id_sac_area: areaId })
    return normalizeSacSubjects(await httpClient<{ data?: Array<Record<string, unknown>> }>(`/api/sac/assuntos${query ? `?${query}` : ''}`, {
      method: 'GET',
      cache: 'no-store',
    }))
  },
  async users() {
    return normalizeSacLookupOptions(await httpClient<{ data?: Array<Record<string, unknown>> }>('/api/sac/usuarios', {
      method: 'GET',
      cache: 'no-store',
    }))
  },
  async moduleConfig() {
    return normalizeSacModuleConfig(await httpClient<{ data?: Record<string, unknown> }>('/api/sac/configuracoes', {
      method: 'GET',
      cache: 'no-store',
    }))
  },
  async saveConfig(payload: Record<string, unknown>) {
    return httpClient('/api/sac/configuracoes', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })
  },
  async saveArea(payload: Record<string, unknown>) {
    return httpClient('/api/sac/areas', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })
  },
  async deleteArea(id: string) {
    return httpClient(`/api/sac/areas/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
    })
  },
  async saveSubject(payload: Record<string, unknown>) {
    return httpClient('/api/sac/assuntos', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })
  },
  async deleteSubject(id: string) {
    return httpClient(`/api/sac/assuntos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
    })
  },
  async areaResponsibles(areaId: string) {
    return normalizeSacAreaResponsibles(await httpClient<{ data?: Array<Record<string, unknown>> }>(`/api/sac/areas/${encodeURIComponent(areaId)}/responsaveis`, {
      method: 'GET',
      cache: 'no-store',
    }))
  },
  async saveAreaResponsible(areaId: string, payload: Record<string, unknown>) {
    return httpClient(`/api/sac/areas/${encodeURIComponent(areaId)}/responsaveis`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })
  },
  async deleteAreaResponsible(id: string) {
    return httpClient(`/api/sac/areas/responsaveis/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
    })
  },
}
