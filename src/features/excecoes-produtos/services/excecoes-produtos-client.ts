'use client'

import { httpClient } from '@/src/services/http/http-client'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudListFilters, CrudListResponse, CrudResource } from '@/src/components/crud-base/types'
import type {
  ExcecaoProdutoApiRow,
  ExcecaoProdutoCriterionOption,
  ExcecaoProdutoWizardDraft,
  ExcecaoProdutoWizardPayload,
} from '@/src/features/excecoes-produtos/services/excecoes-produtos-types'

export const excecoesProdutosClient = {
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

    return httpClient<CrudListResponse>(`/api/excecoes-produtos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getWizard(id: string) {
    return httpClient<{ record: ExcecaoProdutoApiRow; draft: ExcecaoProdutoWizardDraft; originalRows: ExcecaoProdutoApiRow[] }>(`/api/excecoes-produtos/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveWizard(payload: ExcecaoProdutoWizardPayload) {
    return httpClient<{ success: true; id: string }>(`/api/excecoes-produtos/wizard`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  delete(ids: string[]) {
    return httpClient<{ success: true }>(`/api/excecoes-produtos`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  async loadLookupOptions(resource: CrudResource, query: string, page: number, perPage: number): Promise<ExcecaoProdutoCriterionOption[]> {
    const items = await loadCrudLookupOptions(resource, query, page, perPage)
    return items.map((item) => ({ id: item.value, label: item.label }))
  },
}
