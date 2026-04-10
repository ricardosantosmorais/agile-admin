import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { CrudListResponse } from '@/src/components/crud-base/types'
import { httpClient } from '@/src/services/http/http-client'
import type {
  FormaEntregaDataRecord,
  FormaEntregaOcorrenciaRecord,
  FormaEntregaRegraRecord,
} from '@/src/features/formas-entrega/services/formas-entrega-mappers'

const baseClient = createCrudClient('/api/formas-entrega')

export type CepCidadeOption = {
  id_cidade: string
  cidade: string
  uf: string
}

export type CepBairroOption = {
  id_bairro: string
  bairro: string
  id_cidade: string
}

export type FaixaCepOption = {
  cep_inicial: string
  cep_final: string
}

export type FormaEntregaRegrasFilters = {
  page: number
  perPage: number
  orderBy: 'nome' | 'tipo' | 'valor' | 'prazo'
  sort: 'asc' | 'desc'
  nome: string
  tipo: string
  valorFrom: string
  valorTo: string
  prazoFrom: string
  prazoTo: string
}

export const formasEntregaClient = {
  ...baseClient,
  listRegras(id: string, filters: FormaEntregaRegrasFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    if (filters.nome.trim()) params.set('nome', filters.nome.trim())
    if (filters.tipo.trim()) params.set('tipo', filters.tipo.trim())
    if (filters.valorFrom.trim()) params.set('valorFrom', filters.valorFrom.trim())
    if (filters.valorTo.trim()) params.set('valorTo', filters.valorTo.trim())
    if (filters.prazoFrom.trim()) params.set('prazoFrom', filters.prazoFrom.trim())
    if (filters.prazoTo.trim()) params.set('prazoTo', filters.prazoTo.trim())

    return httpClient<CrudListResponse & { data: FormaEntregaRegraRecord[] }>(`/api/formas-entrega/${id}/regras?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveRegra(id: string, payload: Record<string, unknown>) {
    return httpClient<{ id: string }[]>(`/api/formas-entrega/${id}/regras`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteRegras(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/formas-entrega/${id}/regras`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  saveRegraLocalidades(id: string, regraId: string, payload: Array<Record<string, unknown>>, deleteIds: string[] = []) {
    return httpClient(`/api/formas-entrega/${id}/regras`, {
      method: 'POST',
      body: JSON.stringify({ action: 'localidades', regraId, payload, deleteIds }),
      cache: 'no-store',
    })
  },
  replaceRegraComplementares(id: string, regraId: string, payload: Array<Record<string, unknown>>) {
    return httpClient(`/api/formas-entrega/${id}/regras`, {
      method: 'POST',
      body: JSON.stringify({ action: 'complementares', regraId, payload }),
      cache: 'no-store',
    })
  },
  listDatas(id: string) {
    return httpClient<FormaEntregaDataRecord[]>(`/api/formas-entrega/${id}/datas`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveData(id: string, payload: Record<string, unknown>) {
    return httpClient(`/api/formas-entrega/${id}/datas`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  createData(id: string, payload: Record<string, unknown>) {
    return formasEntregaClient.saveData(id, payload)
  },
  deleteDatas(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/formas-entrega/${id}/datas`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  listRestricoes(id: string) {
    return httpClient<FormaEntregaOcorrenciaRecord[]>(`/api/formas-entrega/${id}/restricoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  createRestricao(id: string, payload: Record<string, unknown>) {
    return httpClient(`/api/formas-entrega/${id}/restricoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteRestricoes(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/formas-entrega/${id}/restricoes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  listExcecoes(id: string) {
    return httpClient<FormaEntregaOcorrenciaRecord[]>(`/api/formas-entrega/${id}/excecoes`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  createExcecao(id: string, payload: Record<string, unknown>) {
    return httpClient(`/api/formas-entrega/${id}/excecoes`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteExcecoes(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/formas-entrega/${id}/excecoes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  listCidades(estados: string[]) {
    return httpClient<CepCidadeOption[]>(`/api/formas-entrega/geo/cidades?ufs=${encodeURIComponent(estados.join(','))}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  listBairros(cidades: string[]) {
    return httpClient<CepBairroOption[]>(`/api/formas-entrega/geo/bairros?cidades=${encodeURIComponent(cidades.join(','))}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  listFaixas(scope: 'estado' | 'cidade' | 'bairro', id: string) {
    return httpClient<FaixaCepOption[]>(`/api/formas-entrega/geo/faixas?scope=${scope}&id=${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
}
