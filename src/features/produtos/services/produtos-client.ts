'use client'

import { httpClient } from '@/src/services/http/http-client'
import type { CrudDataClient, CrudListFilters, CrudListResponse, CrudOption, CrudRecord, CrudResource } from '@/src/components/crud-base/types'
import { loadCrudLookupOptions, sanitizeCrudPayload } from '@/src/components/crud-base/crud-client'

export const produtosClient: CrudDataClient = {
  list(filters: CrudListFilters, embed?: string) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    if (embed) {
      params.set('embed', embed)
    }

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || key.endsWith('_label')) {
        continue
      }

      const normalized = typeof value === 'number' ? String(value) : value.trim()
      if (normalized) {
        params.set(key, normalized)
      }
    }

    return httpClient<CrudListResponse>(`/api/produtos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getById(id: string, embed?: string) {
    const params = new URLSearchParams()
    if (embed) {
      params.set('embed', embed)
    }

    const query = params.size ? `?${params.toString()}` : ''
    return httpClient<CrudRecord>(`/api/produtos/${encodeURIComponent(id)}${query}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  save(payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/produtos`, {
      method: 'POST',
      body: JSON.stringify(sanitizeCrudPayload(payload)),
      cache: 'no-store',
    })
  },
  delete(ids: string[]) {
    return httpClient<{ success: true }>(`/api/produtos`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  async listOptions(resource: CrudResource) {
    const items = await loadCrudLookupOptions(resource, '', 1, 1000)
    return items.map((item) => ({ value: item.value, label: item.label })) satisfies CrudOption[]
  },
}
