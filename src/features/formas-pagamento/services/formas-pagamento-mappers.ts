'use client'

import type { CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'

export type FormaPagamentoTipo =
  | 'boleto_antecipado'
  | 'boleto_faturado'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'cheque'
  | 'deposito_antecipado'
  | 'deposito_faturado'
  | 'dinheiro'
  | 'pix'
  | 'pos'

export type FormaPagamentoOcorrencia =
  | 'canal_distribuicao'
  | 'cliente'
  | 'departamento'
  | 'filial'
  | 'forma_entrega'
  | 'fornecedor'
  | 'grupo'
  | 'marca'
  | 'produto'
  | 'produto_pai'
  | 'segmento'
  | 'tipo'
  | 'tipo_cliente'
  | 'uf'
  | 'todos'

export type FormaPagamentoCondicaoRecord = {
  id_forma_pagamento: string
  id_condicao_pagamento: string
  condicao_pagamento?: {
    id?: string
    codigo?: string | null
    nome?: string | null
    parcelas?: number | string | null
    prazo_medio?: number | string | null
  } | null
}

export type FormaPagamentoOcorrenciaRecord = {
  id: string
  id_forma_pagamento: string
  ocorrencia: FormaPagamentoOcorrencia
  id_objeto?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  ativo?: boolean
  canal_distribuicao?: { id?: string; nome?: string | null } | null
  cliente?: { id?: string; nome_fantasia?: string | null; razao_social?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  filial?: { id?: string; nome_fantasia?: string | null; nome?: string | null } | null
  forma_entrega?: { id?: string; nome?: string | null } | null
  fornecedor?: { id?: string; nome_fantasia?: string | null; nome?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  produto?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
}

export const FORMA_PAGAMENTO_TIPO_OPTIONS: Array<{ value: FormaPagamentoTipo; labelKey: string; label: string }> = [
  { value: 'boleto_antecipado', labelKey: 'financial.paymentMethods.types.boletoAntecipado', label: 'Boleto antecipado' },
  { value: 'boleto_faturado', labelKey: 'financial.paymentMethods.types.boletoFaturado', label: 'Boleto faturado' },
  { value: 'cartao_credito', labelKey: 'financial.paymentMethods.types.creditCard', label: 'Cartão de crédito' },
  { value: 'cartao_debito', labelKey: 'financial.paymentMethods.types.debitCard', label: 'Cartão de débito' },
  { value: 'cheque', labelKey: 'financial.paymentMethods.types.check', label: 'Cheque' },
  { value: 'deposito_antecipado', labelKey: 'financial.paymentMethods.types.advanceDeposit', label: 'Depósito antecipado' },
  { value: 'deposito_faturado', labelKey: 'financial.paymentMethods.types.billedDeposit', label: 'Depósito faturado' },
  { value: 'dinheiro', labelKey: 'financial.paymentMethods.types.cash', label: 'Dinheiro' },
  { value: 'pix', labelKey: 'financial.paymentMethods.types.pix', label: 'PIX' },
  { value: 'pos', labelKey: 'financial.paymentMethods.types.pos', label: 'POS' },
]

export function getFormaPagamentoTipoLabel(value: unknown) {
  return FORMA_PAGAMENTO_TIPO_OPTIONS.find((item) => item.value === value)?.label || String(value || '-')
}

export function formatFormaPagamentoOccurrenceLabel(item: FormaPagamentoOcorrenciaRecord) {
  switch (item.ocorrencia) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.nome || item.id_objeto || '-'
    case 'cliente':
      return item.cliente?.nome_fantasia || item.cliente?.razao_social || item.id_objeto || '-'
    case 'departamento':
      return item.departamento?.nome || item.id_objeto || '-'
    case 'filial':
      return item.filial?.nome_fantasia || item.filial?.nome || item.id_objeto || '-'
    case 'forma_entrega':
      return item.forma_entrega?.nome || item.id_objeto || '-'
    case 'fornecedor':
      return item.fornecedor?.nome_fantasia || item.fornecedor?.nome || item.id_objeto || '-'
    case 'grupo':
      return item.grupo?.nome || item.id_objeto || '-'
    case 'marca':
      return item.marca?.nome || item.id_objeto || '-'
    case 'produto':
    case 'produto_pai':
      return item.produto?.nome || item.id_objeto || '-'
    case 'segmento':
      return item.segmento?.nome || item.id_objeto || '-'
    case 'tipo':
      return item.id_objeto === 'PF' ? 'Pessoa física' : item.id_objeto === 'PJ' ? 'Pessoa jurídica' : String(item.id_objeto || '-')
    case 'tipo_cliente':
      return item.id_objeto === 'C' ? 'Consumo' : item.id_objeto === 'R' ? 'Revenda' : item.id_objeto === 'F' ? 'Funcionário' : String(item.id_objeto || '-')
    case 'uf':
      return String(item.id_objeto || '-')
    case 'todos':
      return 'Todos'
  }
}

export function occurrenceLookupValue(item: FormaPagamentoOcorrenciaRecord): LookupOption | null {
  switch (item.ocorrencia) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.id ? { id: item.canal_distribuicao.id, label: item.canal_distribuicao.nome || item.canal_distribuicao.id } : null
    case 'cliente':
      return item.cliente?.id ? { id: item.cliente.id, label: item.cliente.nome_fantasia || item.cliente.razao_social || item.cliente.id } : null
    case 'departamento':
      return item.departamento?.id ? { id: item.departamento.id, label: item.departamento.nome || item.departamento.id } : null
    case 'filial':
      return item.filial?.id ? { id: item.filial.id, label: item.filial.nome_fantasia || item.filial.nome || item.filial.id } : null
    case 'forma_entrega':
      return item.forma_entrega?.id ? { id: item.forma_entrega.id, label: item.forma_entrega.nome || item.forma_entrega.id } : null
    case 'fornecedor':
      return item.fornecedor?.id ? { id: item.fornecedor.id, label: item.fornecedor.nome_fantasia || item.fornecedor.nome || item.fornecedor.id } : null
    case 'grupo':
      return item.grupo?.id ? { id: item.grupo.id, label: item.grupo.nome || item.grupo.id } : null
    case 'marca':
      return item.marca?.id ? { id: item.marca.id, label: item.marca.nome || item.marca.id } : null
    case 'produto':
    case 'produto_pai':
      return item.produto?.id ? { id: item.produto.id, label: item.produto.nome || item.produto.id } : null
    case 'segmento':
      return item.segmento?.id ? { id: item.segmento.id, label: item.segmento.nome || item.segmento.id } : null
    default:
      return null
  }
}

export function forceInternalizacaoManual(record: CrudRecord) {
  const tipo = String(record.tipo || '')
  if (tipo === 'pix' || tipo === 'cartao_credito') {
    return false
  }

  return record.internaliza_auto
}
