import type { CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'

export type CondicaoPagamentoOcorrencia =
  | 'canal_distribuicao'
  | 'contribuinte'
  | 'cliente'
  | 'departamento'
  | 'filial'
  | 'forma_entrega'
  | 'fornecedor'
  | 'grupo'
  | 'marca'
  | 'praca'
  | 'produto'
  | 'produto_pai'
  | 'rede'
  | 'segmento'
  | 'supervisor'
  | 'tabela_preco'
  | 'tipo_cliente'
  | 'uf'
  | 'vendedor'
  | 'todos'

export type CondicaoPagamentoOcorrenciaRecord = {
  id: string
  id_condicao_pagamento: string
  ocorrencia: CondicaoPagamentoOcorrencia
  id_objeto?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  ativo?: boolean | number | string | null
  id_sync?: string | number | null
  canal_distribuicao?: { id?: string; nome?: string | null } | null
  cliente?: { id?: string; nome_fantasia?: string | null; razao_social?: string | null; nome?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  filial?: { id?: string; nome_fantasia?: string | null; nome?: string | null } | null
  forma_entrega?: { id?: string; nome?: string | null } | null
  fornecedor?: { id?: string; nome_fantasia?: string | null; nome?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  praca?: { id?: string; nome?: string | null } | null
  produto?: { id?: string; nome?: string | null } | null
  produto_pai?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
  supervisor?: { id?: string; nome?: string | null } | null
  tabela_preco?: { id?: string; nome?: string | null } | null
  vendedor?: { id?: string; nome?: string | null } | null
}

export const CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES: CondicaoPagamentoOcorrencia[] = [
  'canal_distribuicao',
  'contribuinte',
  'cliente',
  'filial',
  'grupo',
  'praca',
  'rede',
  'segmento',
  'supervisor',
  'tabela_preco',
  'tipo_cliente',
  'uf',
  'vendedor',
]

export const CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES: CondicaoPagamentoOcorrencia[] = [
  'canal_distribuicao',
  'contribuinte',
  'cliente',
  'departamento',
  'filial',
  'forma_entrega',
  'fornecedor',
  'grupo',
  'marca',
  'produto',
  'produto_pai',
  'segmento',
  'tabela_preco',
  'tipo_cliente',
  'uf',
  'vendedor',
  'todos',
]

function namedLabel(entity?: { id?: string; nome?: string | null; nome_fantasia?: string | null; razao_social?: string | null } | null) {
  return entity?.nome_fantasia || entity?.razao_social || entity?.nome || entity?.id || null
}

function lookup(entity?: { id?: string; nome?: string | null; nome_fantasia?: string | null; razao_social?: string | null } | null): LookupOption | null {
  return entity?.id ? { id: entity.id, label: namedLabel(entity) || entity.id } : null
}

export function isCondicaoPagamentoOccurrenceSynced(item: CondicaoPagamentoOcorrenciaRecord) {
  return item.id_sync !== undefined && item.id_sync !== null && String(item.id_sync).trim().length > 0
}

export function isCondicaoPagamentoOccurrenceActive(item: Pick<CondicaoPagamentoOcorrenciaRecord, 'ativo'>) {
  return item.ativo === true || item.ativo === 1 || item.ativo === '1'
}

export function formatCondicaoPagamentoOccurrenceLabel(item: CondicaoPagamentoOcorrenciaRecord) {
  switch (item.ocorrencia) {
    case 'canal_distribuicao':
      return namedLabel(item.canal_distribuicao) || item.id_objeto || '-'
    case 'contribuinte':
      return String(item.id_objeto) === '1' ? 'Sim' : String(item.id_objeto) === '0' ? 'Nao' : String(item.id_objeto || '-')
    case 'cliente':
      return namedLabel(item.cliente) || item.id_objeto || '-'
    case 'departamento':
      return namedLabel(item.departamento) || item.id_objeto || '-'
    case 'filial':
      return namedLabel(item.filial) || item.id_objeto || '-'
    case 'forma_entrega':
      return namedLabel(item.forma_entrega) || item.id_objeto || '-'
    case 'fornecedor':
      return namedLabel(item.fornecedor) || item.id_objeto || '-'
    case 'grupo':
      return namedLabel(item.grupo) || item.id_objeto || '-'
    case 'marca':
      return namedLabel(item.marca) || item.id_objeto || '-'
    case 'praca':
      return namedLabel(item.praca) || item.id_objeto || '-'
    case 'produto':
      return namedLabel(item.produto) || item.id_objeto || '-'
    case 'produto_pai':
      return namedLabel(item.produto_pai) || namedLabel(item.produto) || item.id_objeto || '-'
    case 'rede':
      return namedLabel(item.rede) || item.id_objeto || '-'
    case 'segmento':
      return namedLabel(item.segmento) || item.id_objeto || '-'
    case 'supervisor':
      return namedLabel(item.supervisor) || item.id_objeto || '-'
    case 'tabela_preco':
      return namedLabel(item.tabela_preco) || item.id_objeto || '-'
    case 'tipo_cliente':
      return item.id_objeto === 'PF' ? 'Pessoa fisica' : item.id_objeto === 'PJ' ? 'Pessoa juridica' : String(item.id_objeto || '-')
    case 'uf':
      return String(item.id_objeto || '-')
    case 'vendedor':
      return namedLabel(item.vendedor) || item.id_objeto || '-'
    case 'todos':
      return 'Todos'
  }
}

export function occurrenceLookupValue(item: CondicaoPagamentoOcorrenciaRecord): LookupOption | null {
  switch (item.ocorrencia) {
    case 'canal_distribuicao':
      return lookup(item.canal_distribuicao)
    case 'cliente':
      return lookup(item.cliente)
    case 'departamento':
      return lookup(item.departamento)
    case 'filial':
      return lookup(item.filial)
    case 'forma_entrega':
      return lookup(item.forma_entrega)
    case 'fornecedor':
      return lookup(item.fornecedor)
    case 'grupo':
      return lookup(item.grupo)
    case 'marca':
      return lookup(item.marca)
    case 'praca':
      return lookup(item.praca)
    case 'produto':
      return lookup(item.produto)
    case 'produto_pai':
      return lookup(item.produto_pai) || lookup(item.produto)
    case 'rede':
      return lookup(item.rede)
    case 'segmento':
      return lookup(item.segmento)
    case 'supervisor':
      return lookup(item.supervisor)
    case 'tabela_preco':
      return lookup(item.tabela_preco)
    case 'vendedor':
      return lookup(item.vendedor)
    default:
      return null
  }
}

export function normalizeOccurrencePayload(payload: CrudRecord) {
  return {
    ...payload,
    ativo: payload.ativo === false || payload.ativo === 0 || payload.ativo === '0' ? false : true,
  }
}
