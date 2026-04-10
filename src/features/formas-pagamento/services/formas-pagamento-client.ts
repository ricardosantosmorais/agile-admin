import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CrudRecord } from '@/src/components/crud-base/types'
import type {
  FormaPagamentoCondicaoRecord,
  FormaPagamentoOcorrenciaRecord,
} from '@/src/features/formas-pagamento/services/formas-pagamento-mappers'

const baseClient = createCrudClient('/api/formas-de-pagamento')

export const formasPagamentoClient = {
  ...baseClient,
  listCondicoes(id: string) {
    return httpClient<FormaPagamentoCondicaoRecord[]>(`/api/formas-de-pagamento/${id}/condicoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  createCondicao(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/formas-de-pagamento/${id}/condicoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteCondicoes(id: string, items: Array<{ id_condicao_pagamento: string }>) {
    return httpClient<{ success: true }>(`/api/formas-de-pagamento/${id}/condicoes`, {
      method: 'DELETE',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
  listRestricoes(id: string) {
    return httpClient<FormaPagamentoOcorrenciaRecord[]>(`/api/formas-de-pagamento/${id}/restricoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveRestricao(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/formas-de-pagamento/${id}/restricoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteRestricoes(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/formas-de-pagamento/${id}/restricoes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  listExcecoes(id: string) {
    return httpClient<FormaPagamentoOcorrenciaRecord[]>(`/api/formas-de-pagamento/${id}/excecoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveExcecao(id: string, payload: CrudRecord) {
    return httpClient<CrudRecord[]>(`/api/formas-de-pagamento/${id}/excecoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteExcecoes(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/formas-de-pagamento/${id}/excecoes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
}
