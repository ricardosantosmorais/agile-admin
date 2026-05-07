import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CrudRecord } from '@/src/components/crud-base/types'
import type { CondicaoPagamentoOcorrenciaRecord } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-mappers'

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
  listRestricoes(id: string) {
    return httpClient<CondicaoPagamentoOcorrenciaRecord[]>(`/api/condicoes-de-pagamento/${id}/restricoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveRestricao(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/condicoes-de-pagamento/${id}/restricoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteRestricoes(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/condicoes-de-pagamento/${id}/restricoes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  listExcecoes(id: string) {
    return httpClient<CondicaoPagamentoOcorrenciaRecord[]>(`/api/condicoes-de-pagamento/${id}/excecoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveExcecao(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/condicoes-de-pagamento/${id}/excecoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteExcecoes(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/condicoes-de-pagamento/${id}/excecoes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
}
