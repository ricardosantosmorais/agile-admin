'use client'

import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import { appData } from '@/src/services/app-data'
import type {
  SimuladorPrecosContext,
  SimuladorPrecosDraft,
  SimuladorPrecosResult,
} from '@/src/features/consultas-simulador-precos/services/simulador-precos-types'

export const simuladorPrecosClient = {
  async getContext() {
    return httpClient<{ data: SimuladorPrecosContext }>('/api/consultas/simulador-precos')
  },

  async simulate(payload: SimuladorPrecosDraft) {
    return httpClient<{ data: SimuladorPrecosResult }>('/api/consultas/simulador-precos', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async loadLookupOptions(resource: Parameters<typeof loadCrudLookupOptions>[0], query: string, page: number, perPage: number) {
    const items = await loadCrudLookupOptions(resource, query, page, perPage)
    return items.map((item) => ({ id: item.value, label: item.label }))
  },

  async loadClientOptions(query: string, page: number, perPage: number) {
    return appData.clients.lookup('clientes', query, page, perPage)
  },

  async loadPackagingOptions(productId: string, query: string, page: number, perPage: number) {
    void query
    void page
    void perPage

    if (!productId.trim()) return []

    const params = new URLSearchParams({
      id_produto: productId.trim(),
    })

    const response = await httpClient<Array<{ value: string; label: string }>>(`/api/lookups/produtos-embalagens?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return response.map((item) => ({ id: item.value, label: item.label }))
  },
}
