import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CrudListFilters, CrudListResponse, CrudListRecord } from '@/src/components/crud-base/types'

export type AppLogRecord = CrudListRecord & {
  plataforma?: string | null
  created_at?: string | null
  status?: string | null
}

export type AppLogsResponse = CrudListResponse & {
  data: AppLogRecord[]
}

export const appsClient = {
  ...createCrudClient('/api/apps'),
  logs(id: string, filters: CrudListFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) continue
      const normalized = typeof value === 'number' ? String(value) : value.trim()
      if (normalized) params.set(key, normalized)
    }

    return httpClient<AppLogsResponse>(`/api/apps/${id}/logs?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  deploy(id: string, platform: 'android' | 'ios') {
    return httpClient<{ success: true; message?: string }>(`/api/apps/${id}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
      cache: 'no-store',
    })
  },
  buildEmail(id: string, email: string) {
    return httpClient<{ success: true; message?: string }>(`/api/apps/${id}/build-email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
      cache: 'no-store',
    })
  },
}
