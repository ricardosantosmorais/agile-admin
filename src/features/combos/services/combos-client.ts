'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

type ComboRecordWithRelations = {
  produtos?: ComboProdutoRecord[] | null
  excecoes?: ComboExcecaoRecord[] | null
}

export type ComboProdutoRecord = {
  id: string
  tipo: string
  altera_quantidade: boolean | number | string
  preco?: number | string | null
  desconto?: number | string | null
  pedido_minimo?: number | string | null
  pedido_maximo?: number | string | null
  produto?: { id?: string; nome?: string | null } | null
  produto_pai?: { id?: string; nome?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  fornecedor?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  colecao?: { id?: string; nome?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  embalagem?: { id?: string; nome?: string | null } | null
}

export type ComboExcecaoRecord = {
  id: string
  universo: string
  id_objeto_universo?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  ativo?: boolean | number | string
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  praca?: { id?: string; nome?: string | null } | null
  condicao_pagamento?: { id?: string; nome?: string | null } | null
  cliente?: { id?: string; nome_fantasia?: string | null; razao_social?: string | null } | null
  forma_pagamento?: { id?: string; nome?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
  supervisor?: { id?: string; nome?: string | null } | null
  tabela_preco?: { id?: string; nome?: string | null } | null
  vendedor?: { id?: string; nome?: string | null } | null
}

const baseClient = createCrudClient('/api/combos')

export const combosClient = {
  ...baseClient,
  async listProdutos(id: string) {
    const response = await baseClient.getById(id, 'produtos') as ComboRecordWithRelations
    return Array.isArray(response.produtos) ? response.produtos : []
  },
  createProduto(id: string, payload: Record<string, unknown>) {
    return httpClient('/api/combo-produtos', {
      method: 'POST',
      body: JSON.stringify({ ...payload, id_promocao: id }),
      cache: 'no-store',
    })
  },
  deleteProdutos(id: string, ids: string[]) {
    return httpClient('/api/combo-produtos', {
      method: 'DELETE',
      body: JSON.stringify({ id_promocao: id, ids }),
      cache: 'no-store',
    })
  },
  async listExcecoes(id: string) {
    const response = await baseClient.getById(id, 'excecoes') as ComboRecordWithRelations
    return Array.isArray(response.excecoes) ? response.excecoes : []
  },
  createExcecao(id: string, payload: Record<string, unknown>) {
    return httpClient('/api/combo-excecoes', {
      method: 'POST',
      body: JSON.stringify({ ...payload, id_promocao: id }),
      cache: 'no-store',
    })
  },
  deleteExcecoes(id: string, ids: string[]) {
    return httpClient('/api/combo-excecoes', {
      method: 'DELETE',
      body: JSON.stringify({ id_promocao: id, ids }),
      cache: 'no-store',
    })
  },
}
