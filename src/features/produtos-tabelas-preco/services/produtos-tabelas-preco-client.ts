import { httpClient } from '@/src/services/http/http-client'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudListFilters, CrudListResponse } from '@/src/components/crud-base/types'

export type ProdutoTabelaPrecoQuickItem = {
  id_tabela_preco: string
  nome_tabela: string
  preco1: string
  preco2: string
  preco3: string
  preco4: string
  preco5: string
  preco6: string
  preco7: string
  id_sync: string | null
}

export type ProdutoTabelaPrecoQuickPayload = {
  id_produto: string
  produto_lookup: { id: string; label: string } | null
  items: ProdutoTabelaPrecoQuickItem[]
}

export const produtosTabelasPrecoClient = {
  list(filters: CrudListFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || key.endsWith('_label')) {
        continue
      }

      const normalized = typeof value === 'number' ? String(value) : value.trim()
      if (normalized) {
        params.set(key, normalized)
      }
    }

    return httpClient<CrudListResponse>(`/api/produtos-x-tabelas-de-preco?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  delete(ids: string[]) {
    return httpClient<{ success: true }>(`/api/produtos-x-tabelas-de-preco`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  loadQuickPricing(idProduto: string) {
    return httpClient<ProdutoTabelaPrecoQuickPayload>(`/api/produtos-x-tabelas-de-preco/${encodeURIComponent(idProduto)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveQuickPricing(payload: { id_produto: string; items: ProdutoTabelaPrecoQuickItem[] }) {
    return httpClient<{ success: true }>(`/api/produtos-x-tabelas-de-preco/rapida`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  async loadProductOptions(query: string, page: number, perPage: number) {
    const items = await loadCrudLookupOptions('produtos', query, page, perPage)
    return items.map((item) => ({ id: item.value, label: item.label }))
  },
}
