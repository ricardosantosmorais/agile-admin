'use client'

import { httpClient } from '@/src/services/http/http-client'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudListFilters, CrudListResponse } from '@/src/components/crud-base/types'
import type {
  ProdutoPrecificadorApiRow,
  ProdutoPrecificadorWizardDraft,
  ProdutoPrecificadorWizardPayload,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-types'

export const produtosPrecificadoresClient = {
  list(filters: CrudListFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || key.endsWith('_label')) continue
      const normalized = typeof value === 'number' ? String(value) : value.trim()
      if (normalized) params.set(key, normalized)
    }

    return httpClient<CrudListResponse>(`/api/produtos-x-precificadores?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getWizard(id: string) {
    return httpClient<{ record: ProdutoPrecificadorApiRow; draft: ProdutoPrecificadorWizardDraft; originalRows: ProdutoPrecificadorApiRow[] }>(`/api/produtos-x-precificadores/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveWizard(payload: ProdutoPrecificadorWizardPayload) {
    return httpClient<{ success: true; id: string }>(`/api/produtos-x-precificadores/wizard`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  delete(ids: string[]) {
    return httpClient<{ success: true }>(`/api/produtos-x-precificadores`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  async loadLookupOptions(resource: Parameters<typeof loadCrudLookupOptions>[0], query: string, page: number, perPage: number) {
    const items = await loadCrudLookupOptions(resource, query, page, perPage)
    return items.map((item) => ({ id: item.value, label: item.label }))
  },
  async loadPackagingOptions(productId: string) {
    if (!productId.trim()) return []

    const params = new URLSearchParams({ id_produto: productId.trim(), perPage: '50', page: '1' })
    const response = await httpClient<Array<{ value: string; label: string }>>(`/api/lookups/produtos-embalagens?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return response.map((item) => ({ id: item.value, label: item.label }))
  },
}
