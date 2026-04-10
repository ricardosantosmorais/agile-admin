import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

type RelationResponse<TItem> = {
  data?: TItem[]
}

export type CupomDescontoUniversoRecord = {
  id: string
  tipo: string
  restricao: boolean | number | string
  cnpj_cpf?: string | null
  uf?: string | null
  canal_distribuicao?: { id?: string; nome?: string | null } | null
  cliente?: { id?: string; nome_fantasia?: string | null; razao_social?: string | null } | null
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
}

export type CupomDescontoOcorrenciaRecord = {
  id: string
  tipo: string
  restricao: boolean | number | string
  id_canal_distribuicao?: string | null
  id_colecao?: string | null
  id_departamento?: string | null
  id_fornecedor?: string | null
  id_marca?: string | null
  id_produto?: string | null
  id_produto_pai?: string | null
  canal_distribuicao?: { id?: string; nome?: string | null } | null
  colecao?: { id?: string; nome?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  fornecedor?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  produto?: { id?: string; nome?: string | null } | null
  produto_pai?: { id?: string; nome?: string | null } | null
}

export type CupomDescontoPagamentoRecord = {
  id: string
  restricao: boolean | number | string
  forma_pagamento?: { id?: string; nome?: string | null } | null
  condicao_pagamento?: { id?: string; nome?: string | null } | null
  id_forma_pagamento?: string | null
  id_condicao_pagamento?: string | null
}

function unwrapRelationResponse<TItem>(payload: RelationResponse<TItem> | TItem[]) {
  return Array.isArray(payload) ? payload : (payload.data ?? [])
}

const baseClient = createCrudClient('/api/cupons-desconto')

export const cuponsDescontoClient = {
  ...baseClient,
  async listUniversos(id: string) {
    const response = await httpClient<RelationResponse<CupomDescontoUniversoRecord> | CupomDescontoUniversoRecord[]>(
      `/api/cupons-desconto/${id}/universos`,
      { method: 'GET', cache: 'no-store' },
    )
    return unwrapRelationResponse(response)
  },
  createUniverso(id: string, payload: Record<string, unknown>) {
    return httpClient(`/api/cupons-desconto/${id}/universos`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteUniversos(id: string, ids: string[]) {
    return httpClient(`/api/cupons-desconto/${id}/universos`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  async listOcorrencias(id: string) {
    const response = await httpClient<RelationResponse<CupomDescontoOcorrenciaRecord> | CupomDescontoOcorrenciaRecord[]>(
      `/api/cupons-desconto/${id}/ocorrencias`,
      { method: 'GET', cache: 'no-store' },
    )
    return unwrapRelationResponse(response)
  },
  createOcorrencia(id: string, payload: Record<string, unknown>) {
    return httpClient(`/api/cupons-desconto/${id}/ocorrencias`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteOcorrencias(id: string, ids: string[]) {
    return httpClient(`/api/cupons-desconto/${id}/ocorrencias`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  async listPagamentos(id: string) {
    const response = await httpClient<RelationResponse<CupomDescontoPagamentoRecord> | CupomDescontoPagamentoRecord[]>(
      `/api/cupons-desconto/${id}/pagamentos`,
      { method: 'GET', cache: 'no-store' },
    )
    return unwrapRelationResponse(response)
  },
  createPagamento(id: string, payload: Record<string, unknown>) {
    return httpClient(`/api/cupons-desconto/${id}/pagamentos`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deletePagamentos(id: string, ids: string[]) {
    return httpClient(`/api/cupons-desconto/${id}/pagamentos`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
}
