import { httpClient } from '@/src/services/http/http-client'
import type {
  RelatorioDetail,
  RelatorioListFilters,
  RelatorioListResponse,
  RelatorioProcessoLogsResponse,
  RelatorioProcessosFilters,
  RelatorioProcessosResponse,
} from '@/src/features/relatorios/services/relatorios-types'

function appendFilters(params: URLSearchParams, values: Record<string, unknown>, skipKeys: string[] = []) {
  for (const [key, value] of Object.entries(values)) {
    if (skipKeys.includes(key)) continue
    const normalized = String(value || '').trim()
    if (!normalized) continue
    params.set(key, normalized)
  }
}

export const relatoriosClient = {
  list(filters: RelatorioListFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    appendFilters(params, filters, ['page', 'perPage', 'orderBy', 'sort'])

    return httpClient<RelatorioListResponse>(`/api/relatorios?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getById(id: string) {
    return httpClient<RelatorioDetail>(`/api/relatorios/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  listProcessos(id: string, filters: RelatorioProcessosFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    appendFilters(params, filters, ['page', 'perPage', 'orderBy', 'sort'])

    return httpClient<RelatorioProcessosResponse>(`/api/relatorios/${encodeURIComponent(id)}/processos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  processar(id: string, values: Record<string, string>) {
    return httpClient<{ success: boolean; id: string }>(`/api/relatorios/${encodeURIComponent(id)}/processar`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ valores: values }),
    })
  },
  cancelarProcesso(id: string) {
    return httpClient<{ success: boolean }>(`/api/processos-relatorios/${encodeURIComponent(id)}/cancelar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },
  reprocessarProcesso(id: string) {
    return httpClient<{ success: boolean }>(`/api/processos-relatorios/${encodeURIComponent(id)}/reprocessar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },
  listLogs(id: string, page = 1, perPage = 30) {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    })

    return httpClient<RelatorioProcessoLogsResponse>(`/api/processos-relatorios/${encodeURIComponent(id)}/logs?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
}
