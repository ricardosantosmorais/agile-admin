import { httpClient } from '@/src/services/http/http-client'
import type { CrudDataClient, CrudListFilters, CrudListResponse, CrudOption, CrudRecord, CrudResource } from '@/src/components/crud-base/types'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'

function sanitizePayload(payload: CrudRecord) {
  const result: CrudRecord = {}

  for (const [key, value] of Object.entries(payload)) {
    if (['created_at', 'updated_at', 'deleted_at'].includes(key)) {
      continue
    }
    if (value === undefined) {
      continue
    }
    if (Array.isArray(value)) {
      continue
    }
    if (value !== null && typeof value === 'object') {
      continue
    }
    result[key] = value
  }

  return result
}

export const produtosFiliaisClient: CrudDataClient = {
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

    return httpClient<CrudListResponse>(`/api/produtos-x-filiais?${params.toString()}`, {
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
    return httpClient<CrudRecord>(`/api/produtos-x-filiais/${encodeURIComponent(id)}${query}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  save(payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/produtos-x-filiais`, {
      method: 'POST',
      body: JSON.stringify(sanitizePayload(payload)),
      cache: 'no-store',
    })
  },
  delete(ids: string[]) {
    return httpClient<{ success: true }>(`/api/produtos-x-filiais`, {
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
