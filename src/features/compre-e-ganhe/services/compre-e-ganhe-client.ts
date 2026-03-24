'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

export type BrindeRegraRecord = {
  id: string
  id_regra?: string | null
  tipo_regra?: string | null
  tipo?: string | null
  pedido_minimo?: number | string | null
  pedido_maximo?: number | string | null
  produto_pai?: { id?: string; nome?: string | null } | null
  produtos?: { id?: string; nome?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  fornecedor?: { id?: string; nome_fantasia?: string | null; nome?: string | null } | null
  colecoes?: { id?: string; nome?: string | null } | null
  embalagem?: { id?: string; nome?: string | null } | null
  id_produto_pai?: string | null
  id_produto?: string | null
  id_departamento?: string | null
  id_fornecedor?: string | null
  id_colecao?: string | null
  id_embalagem?: string | null
}

export type BrindeProdutoRecord = {
  id: string
  id_regra?: string | null
  quantidade?: number | string | null
  quantidade_maxima?: number | string | null
  produto?: { id?: string; nome?: string | null } | null
  embalagem?: { id?: string; nome?: string | null } | null
  id_produto?: string | null
  id_embalagem?: string | null
}

export type BrindeUniversoRecord = {
  id: string
  id_regra?: string | null
  universo: string
  id_objeto?: string | null
  ativo?: boolean | number | string
  cliente?: { id?: string; nome_fantasia?: string | null; razao_social?: string | null } | null
  filial?: { id?: string; nome_fantasia?: string | null; nome?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  praca?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
  supervisor?: { id?: string; nome?: string | null } | null
  tabela_preco?: { id?: string; nome?: string | null } | null
  vendedor?: { id?: string; nome?: string | null } | null
}

type BrindeWithRelations = {
  regras?: BrindeRegraRecord[] | null
  produtos?: BrindeProdutoRecord[] | null
  excecoes?: BrindeUniversoRecord[] | null
  restricoes?: BrindeUniversoRecord[] | null
}

const baseClient = createCrudClient('/api/compre-e-ganhe')

export const compreEGanheClient = {
  ...baseClient,
  async listRegras(id: string) {
    const response = await baseClient.getById(id, 'regras') as BrindeWithRelations
    return Array.isArray(response.regras) ? response.regras : []
  },
  async listProdutos(id: string) {
    const response = await baseClient.getById(id, 'produtos') as BrindeWithRelations
    return Array.isArray(response.produtos) ? response.produtos : []
  },
  async listExcecoes(id: string) {
    const response = await baseClient.getById(id, 'excecoes') as BrindeWithRelations
    return Array.isArray(response.excecoes) ? response.excecoes : []
  },
  async listRestricoes(id: string) {
    const response = await baseClient.getById(id, 'restricoes') as BrindeWithRelations
    return Array.isArray(response.restricoes) ? response.restricoes : []
  },
  createRegra(payload: Record<string, unknown>) {
    return httpClient('/api/compre-e-ganhe/regras', { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' })
  },
  deleteRegras(ids: string[]) {
    return httpClient('/api/compre-e-ganhe/regras', { method: 'DELETE', body: JSON.stringify(ids.map((id) => ({ id }))), cache: 'no-store' })
  },
  createProduto(payload: Record<string, unknown>) {
    return httpClient('/api/compre-e-ganhe/produtos', { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' })
  },
  deleteProdutos(ids: string[]) {
    return httpClient('/api/compre-e-ganhe/produtos', { method: 'DELETE', body: JSON.stringify(ids.map((id) => ({ id }))), cache: 'no-store' })
  },
  createExcecao(payload: Record<string, unknown>) {
    return httpClient('/api/compre-e-ganhe/excecoes', { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' })
  },
  deleteExcecoes(ids: string[]) {
    return httpClient('/api/compre-e-ganhe/excecoes', { method: 'DELETE', body: JSON.stringify(ids.map((id) => ({ id }))), cache: 'no-store' })
  },
  createRestricao(payload: Record<string, unknown>) {
    return httpClient('/api/compre-e-ganhe/restricoes', { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' })
  },
  deleteRestricoes(ids: string[]) {
    return httpClient('/api/compre-e-ganhe/restricoes', { method: 'DELETE', body: JSON.stringify(ids.map((id) => ({ id }))), cache: 'no-store' })
  },
}
