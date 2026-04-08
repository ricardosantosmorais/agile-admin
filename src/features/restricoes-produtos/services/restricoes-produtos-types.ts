export type RestricaoProdutoAudienceType =
  | 'todos'
  | 'canal_distribuicao_cliente'
  | 'cliente'
  | 'contribuinte'
  | 'filial'
  | 'grupo'
  | 'praca'
  | 'rede'
  | 'segmento'
  | 'supervisor'
  | 'tabela_preco'
  | 'tipo_cliente'
  | 'uf'
  | 'vendedor'

export type RestricaoProdutoProductType =
  | 'todos'
  | 'canal_distribuicao_produto'
  | 'colecao'
  | 'departamento'
  | 'fornecedor'
  | 'marca'
  | 'produto'
  | 'produto_pai'
  | 'promocao'

export type RestricaoProdutoCriterionOption = {
  id: string
  label: string
}

export type RestricaoProdutoAudienceCriterion = {
  id: string
  type: RestricaoProdutoAudienceType
  values: RestricaoProdutoCriterionOption[]
}

export type RestricaoProdutoProductCriterion = {
  id: string
  type: RestricaoProdutoProductType
  values: RestricaoProdutoCriterionOption[]
}

export type RestricaoProdutoGeneralDraft = {
  perfil: string
  ativo: boolean
  orcamento: boolean
  pedido_minimo: string
  motivo: string
}

export type RestricaoProdutoWeekdayConfig = {
  active: boolean
  from: string
  to: string
}

export type RestricaoProdutoConditionsDraft = {
  data_inicio: string
  data_fim: string
  id_forma_pagamento: string
  id_condicao_pagamento: string
  tipo_entrega: string
  forma_pagamento_lookup: RestricaoProdutoCriterionOption | null
  condicao_pagamento_lookup: RestricaoProdutoCriterionOption | null
  seg: RestricaoProdutoWeekdayConfig
  ter: RestricaoProdutoWeekdayConfig
  qua: RestricaoProdutoWeekdayConfig
  qui: RestricaoProdutoWeekdayConfig
  sex: RestricaoProdutoWeekdayConfig
  sab: RestricaoProdutoWeekdayConfig
  dom: RestricaoProdutoWeekdayConfig
}

export type RestricaoProdutoWizardDraft = {
  audiences: RestricaoProdutoAudienceCriterion[]
  products: RestricaoProdutoProductCriterion[]
  general: RestricaoProdutoGeneralDraft
  conditions: RestricaoProdutoConditionsDraft
}

export type RestricaoProdutoApiRow = {
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
  id_produto?: string | null
  id_marca?: string | null
  id_produto_pai?: string | null
  id_fornecedor?: string | null
  id_canal_distribuicao_produto?: string | null
  id_colecao?: string | null
  id_departamento?: string | null
  id_promocao?: string | null
  perfil?: string | null
  ativo?: boolean | number | string | null
  orcamento?: boolean | number | string | null
  pedido_minimo?: number | string | null
  motivo?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  id_forma_pagamento?: string | null
  id_condicao_pagamento?: string | null
  tipo_entrega?: string | null
  seg?: boolean | number | string | null
  seg_horario_de?: string | null
  seg_horario_ate?: string | null
  ter?: boolean | number | string | null
  ter_horario_de?: string | null
  ter_horario_ate?: string | null
  qua?: boolean | number | string | null
  qua_horario_de?: string | null
  qua_horario_ate?: string | null
  qui?: boolean | number | string | null
  qui_horario_de?: string | null
  qui_horario_ate?: string | null
  sex?: boolean | number | string | null
  sex_horario_de?: string | null
  sex_horario_ate?: string | null
  sab?: boolean | number | string | null
  sab_horario_de?: string | null
  sab_horario_ate?: string | null
  dom?: boolean | number | string | null
  dom_horario_de?: string | null
  dom_horario_ate?: string | null
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
  produto?: { id?: string; nome?: string | null; codigo?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  produto_pai?: { id?: string; nome?: string | null; codigo?: string | null } | null
  fornecedor?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  canal_distribuicao_produto?: { id?: string; nome?: string | null } | null
  colecao?: { id?: string; nome?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  promocao?: { id?: string; nome?: string | null } | null
  forma_pagamento?: { id?: string; nome?: string | null } | null
  condicao_pagamento?: { id?: string; nome?: string | null } | null
  filhos?: RestricaoProdutoApiRow[]
  [key: string]: unknown
}

export type RestricaoProdutoWizardPayload = {
  id?: string
  rows: RestricaoProdutoApiRow[]
  deleteIds: string[]
}
