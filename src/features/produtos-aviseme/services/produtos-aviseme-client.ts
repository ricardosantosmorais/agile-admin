import { httpClient } from '@/src/services/http/http-client'
import type { AvisemeDetailItem, AvisemeListResponse } from '@/src/features/produtos-aviseme/services/produtos-aviseme-mappers'

export type ProdutosAvisemeFilters = {
  page: number
  perPage: number
  orderBy: string
  sort: 'asc' | 'desc'
  id_produto: string
  id_filial: string
  data_inicio: string
  data_fim: string
}

export const INITIAL_PRODUTOS_AVISEME_FILTERS: ProdutosAvisemeFilters = {
  page: 1,
  perPage: 30,
  orderBy: 'ultima_data_solicitacao',
  sort: 'asc',
  id_produto: '',
  id_filial: '',
  data_inicio: '',
  data_fim: '',
}

export const produtosAvisemeClient = {
  list(filters: ProdutosAvisemeFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value) {
        continue
      }
      params.set(key, String(value))
    }

    return httpClient<AvisemeListResponse>(`/api/avise-me?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getDetails(idProduto: string, idFilial: string) {
    const params = new URLSearchParams({
      idProduto,
      idFilial,
    })

    return httpClient<AvisemeDetailItem[]>(`/api/avise-me/detalhes?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
}
