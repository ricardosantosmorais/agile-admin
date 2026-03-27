'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CrudRecord } from '@/src/components/crud-base/types'

export type CondicaoPagamentoFilialRecord = {
  id_condicao_pagamento: string
  id_filial: string
  filial?: {
    id?: string
    codigo?: string | null
    nome_fantasia?: string | null
    nome?: string | null
    ativo?: boolean
  } | null
}

const baseClient = createCrudClient('/api/condicoes-de-pagamento')

export const condicoesPagamentoClient = {
  ...baseClient,
  listFiliais(id: string) {
    return httpClient<CondicaoPagamentoFilialRecord[]>(`/api/condicoes-de-pagamento/${id}/filiais`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  createFilial(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/condicoes-de-pagamento/${id}/filiais`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteFiliais(id: string, items: Array<{ id_filial: string }>) {
    return httpClient<{ success: true }>(`/api/condicoes-de-pagamento/${id}/filiais`, {
      method: 'DELETE',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
}
