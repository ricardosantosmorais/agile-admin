import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { CrudDataClient, CrudListFilters, CrudListResponse, CrudRecord } from '@/src/components/crud-base/types'
import { httpClient } from '@/src/services/http/http-client'

export type RelatorioCampoRecord = CrudRecord & {
  id: string
  nome_alias?: string
  campo?: string
  titulo?: string
  tipo?: string
  ordenacao?: string
}

type RelatoriosMasterClient = CrudDataClient & {
  executeQuery: (payload: { idEmpresa: string; sql: string; fonteDados?: string }) => Promise<unknown>
  listCampos: (idQuery: string, filters: CrudListFilters) => Promise<CrudListResponse>
  saveCampo: (payload: CrudRecord) => Promise<CrudRecord>
}

export const relatoriosMasterClient: RelatoriosMasterClient = {
  ...createCrudClient('/api/relatorios-master'),
  executeQuery(payload) {
    return httpClient<unknown>('/api/relatorios-master/query', {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  listCampos(idQuery, filters) {
    const params = new URLSearchParams({
      id_query: idQuery,
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    return httpClient<CrudListResponse>(`/api/relatorios-master/query-campos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveCampo(payload) {
    return httpClient<CrudRecord>('/api/relatorios-master/query-campos', {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
}
