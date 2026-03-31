export type PedidoListFilters = {
  page: number
  perPage: number
  orderBy: string
  sort: 'asc' | 'desc'
  id: string
  id_transacao: string
  codigo: string
  id_filial: string
  id_filial_label: string
  id_filial_estoque: string
  id_filial_estoque_label: string
  id_filial_retira: string
  id_filial_retira_label: string
  cliente_codigo: string
  cliente_cnpj_cpf: string
  data_inicio: string
  data_fim: string
  id_vendedor: string
  id_vendedor_label: string
  id_forma_pagamento_convertida: string
  id_forma_pagamento_convertida_label: string
  id_condicao_pagamento_convertida: string
  id_condicao_pagamento_convertida_label: string
  id_forma_entrega: string
  id_forma_entrega_label: string
  status: string
}

export type PedidoListMeta = {
  page: number
  pages: number
  perPage: number
  from: number
  to: number
  total: number
}

export type PedidoListRecord = {
  id: string
  id_transacao?: string
  codigo?: string
  data?: string
  valor_total_atendido?: number | string
  status?: string
  status_label?: string
  status_tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  cliente_nome?: string
  vendedor_nome?: string
  forma_entrega_nome?: string
  brinde?: boolean
  orcamento?: boolean
  canal?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_id?: string
  utm_term?: string
  venda_assistida?: boolean
  internalizado?: boolean
  hasCorte?: boolean
  canApprovePayment?: boolean
  canCancel?: boolean
}

export type PedidoListResponse = {
  data: PedidoListRecord[]
  meta: PedidoListMeta
}

export type PedidoDetail = Record<string, unknown> & {
  id: string
  data?: string
  status?: string
  status_label?: string
  status_tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  valor_produtos_atendido_ajustado?: number
  valor_total_atendido_ajustado?: number
  hasCorte?: boolean
  canApprovePayment?: boolean
  canCancel?: boolean
  cliente?: Record<string, unknown> | null
  vendedor?: Record<string, unknown> | null
  canal_distribuicao?: Record<string, unknown> | null
  filial?: Record<string, unknown> | null
  filial_nf?: Record<string, unknown> | null
  filial_estoque?: Record<string, unknown> | null
  filial_retira?: Record<string, unknown> | null
  pagamento?: Record<string, unknown> | null
  entrega?: Record<string, unknown> | null
  produtos?: Array<Record<string, unknown>>
  eventos?: Array<Record<string, unknown>>
  logs?: Array<Record<string, unknown>>
}
