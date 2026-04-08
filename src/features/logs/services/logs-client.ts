'use client'

import { normalizeLogDetail, normalizeLogsListResponse } from '@/src/features/logs/services/logs-mappers'
import type { LogDetailRecord, LogsListFilters, LogsListResponse } from '@/src/features/logs/services/logs-types'
import { httpClient } from '@/src/services/http/http-client'

export const logsClient = {
  async list(filters: LogsListFilters): Promise<LogsListResponse> {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
      id_registro: filters.id_registro,
      modulo: filters.modulo,
      id_usuario: filters.id_usuario,
      'data::ge': filters['data::ge'],
      'data::le': filters['data::le'],
      acao: filters.acao,
    })

    const payload = await httpClient<unknown>(`/api/logs?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeLogsListResponse(payload, filters)
  },
  async getById(id: string): Promise<LogDetailRecord> {
    const payload = await httpClient<unknown>(`/api/logs/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeLogDetail(payload)
  },
}

