'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CrudRecord } from '@/src/components/crud-base/types'

export type TabelaPrecoFilialRecord = {
  id_tabela_preco: string
  id_filial: string
  padrao?: boolean
  filial?: {
    id?: string
    codigo?: string | null
    nome_fantasia?: string | null
    nome?: string | null
  } | null
}

const baseClient = createCrudClient('/api/tabelas-de-preco')

export const tabelasPrecoClient = {
  ...baseClient,
  listFiliais(id: string) {
    return httpClient<TabelaPrecoFilialRecord[]>(`/api/tabelas-de-preco/${id}/filiais`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  createFilial(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/tabelas-de-preco/${id}/filiais`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteFiliais(id: string, items: Array<{ id_filial: string }>) {
    return httpClient<{ success: true }>(`/api/tabelas-de-preco/${id}/filiais`, {
      method: 'DELETE',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
}
