export type ProdutoPrecificadorAudienceType =
  | 'todos'
  | 'canal_distribuicao_cliente'
  | 'cliente'
  | 'contribuinte'
  | 'filial'
  | 'fonte_st'
  | 'grupo'
  | 'praca'
  | 'rede'
  | 'segmento'
  | 'supervisor'
  | 'tabela_preco'
  | 'tipo_cliente'
  | 'uf'
  | 'vendedor'

export type ProdutoPrecificadorProductType =
  | 'todos'
  | 'canal_distribuicao_produto'
  | 'colecao'
  | 'departamento'
  | 'fornecedor'
  | 'marca'
  | 'produto'
  | 'produto_pai'
  | 'promocao_precificador'

export type ProdutoPrecificadorCriterionOption = {
  id: string
  label: string
}

export type ProdutoPrecificadorAudienceCriterion = {
  id: string
  type: ProdutoPrecificadorAudienceType
  values: ProdutoPrecificadorCriterionOption[]
}

export type ProdutoPrecificadorProductCriterion = {
  id: string
  type: ProdutoPrecificadorProductType
  values: ProdutoPrecificadorCriterionOption[]
  packaging: ProdutoPrecificadorCriterionOption | null
}

export type ProdutoPrecificadorDefinitionDraft = {
  id: string
  ultimo_preco: boolean
  preco: string
  desconto: string
  acrescimo: string
  pedido_minimo: string
  pedido_maximo: string
  itens_pedido_de: string
  itens_pedido_ate: string
}

export type ProdutoPrecificadorGeneralDraft = {
  nome: string
  codigo: string
  origem: string
  perfil: string
  tipo: string
  posicao: string
  indice: string
  promocao: boolean
  aplica_automatico: boolean
  ativo: boolean
  modifica: boolean
  fator: boolean
  aplica_promocao: boolean
  aplica_orcamento: boolean
  app: boolean
  prioridade: boolean
  promocao_ecommerce: boolean
  conta_corrente: boolean
  credita_desconto: boolean
  preco_base: boolean
  st: boolean
}

export type ProdutoPrecificadorConditionsDraft = {
  data_inicio: string
  data_fim: string
  id_forma_pagamento: string
  id_condicao_pagamento: string
  id_forma_entrega: string
  prazo_medio: string
  forma_pagamento_lookup: ProdutoPrecificadorCriterionOption | null
  condicao_pagamento_lookup: ProdutoPrecificadorCriterionOption | null
}

export type ProdutoPrecificadorWizardDraft = {
  audiences: ProdutoPrecificadorAudienceCriterion[]
  products: ProdutoPrecificadorProductCriterion[]
  definitions: ProdutoPrecificadorDefinitionDraft[]
  general: ProdutoPrecificadorGeneralDraft
  conditions: ProdutoPrecificadorConditionsDraft
}

export type ProdutoPrecificadorApiRow = {
  id?: string
  id_empresa?: string
  id_pai?: string | null
  id_cliente?: string | null
  id_filial?: string | null
  id_grupo?: string | null
  id_canal_distribuicao_cliente?: string | null
  id_rede?: string | null
  id_segmento?: string | null
  id_tabela_preco?: string | null
  id_praca?: string | null
  uf?: string | null
  tipo_cliente?: string | null
  id_supervisor?: string | null
  id_vendedor?: string | null
  contribuinte?: boolean | number | string | null
  fonte_st?: boolean | number | string | null
  id_produto?: string | null
  id_marca?: string | null
  id_produto_pai?: string | null
  id_fornecedor?: string | null
  id_embalagem?: string | null
  id_canal_distribuicao_produto?: string | null
  id_colecao?: string | null
  id_departamento?: string | null
  id_promocao?: string | null
  nome?: string | null
  codigo?: string | null
  tipo?: string | null
  origem?: string | null
  perfil?: string | null
  indice?: number | string | null
  posicao?: number | string | null
  promocao?: boolean | number | string | null
  aplica_automatico?: boolean | number | string | null
  ativo?: boolean | number | string | null
  modifica?: boolean | number | string | null
  fator?: boolean | number | string | null
  aplica_promocao?: boolean | number | string | null
  aplica_orcamento?: boolean | number | string | null
  app?: boolean | number | string | null
  prioridade?: boolean | number | string | null
  promocao_ecommerce?: boolean | number | string | null
  conta_corrente?: boolean | number | string | null
  credita_desconto?: boolean | number | string | null
  preco_base?: boolean | number | string | null
  st?: boolean | number | string | null
  data_inicio?: string | null
  data_fim?: string | null
  id_forma_pagamento?: string | null
  id_condicao_pagamento?: string | null
  id_forma_entrega?: string | null
  prazo_medio?: number | string | null
  ultimo_preco?: boolean | number | string | null
  preco?: number | string | null
  desconto?: number | string | null
  acrescimo?: number | string | null
  pedido_minimo?: number | string | null
  pedido_maximo?: number | string | null
  itens_pedido_de?: number | string | null
  itens_pedido_ate?: number | string | null
  cliente?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  canal_distribuicao_cliente?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
  tabela_preco?: { id?: string; nome?: string | null } | null
  praca?: { id?: string; nome?: string | null } | null
  supervisor?: { id?: string; nome?: string | null } | null
  vendedor?: { id?: string; nome?: string | null } | null
  produto?: { id?: string; nome?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  produto_pai?: { id?: string; nome?: string | null } | null
  fornecedor?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  canal_distribuicao_produto?: { id?: string; nome?: string | null } | null
  colecao?: { id?: string; nome?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  promocao_precificador?: { id?: string; nome?: string | null } | null
  embalagem?: { id?: string; nome?: string | null } | null
  forma_pagamento?: { id?: string; nome?: string | null } | null
  condicao_pagamento?: { id?: string; nome?: string | null } | null
  forma_entrega?: { id?: string; nome?: string | null } | null
  filhos?: ProdutoPrecificadorApiRow[]
  [key: string]: unknown
}

export type ProdutoPrecificadorWizardPayload = {
  id?: string
  rows: ProdutoPrecificadorApiRow[]
  deleteIds: string[]
}
