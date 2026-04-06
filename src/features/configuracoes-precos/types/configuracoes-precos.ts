export type ConfiguracoesPrecosFieldKey =
  | 'aplica_partilha_contribuinte'
  | 'aplica_tributo_revenda'
  | 'aplicacao_cupom_desconto'
  | 'arredonda_valores_embalagem'
  | 'arredonda_valores_financeiro'
  | 'calculo_reverso_fecoep'
  | 'calculo_reverso_ipi'
  | 'calculo_reverso_st'
  | 'icms_externo_fixo'
  | 'id_condicao_pagamento_padrao'
  | 'id_forma_pagamento_padrao'
  | 'id_tabela_preco_padrao'
  | 'id_tabela_preco_pf'
  | 'id_tabela_preco_pj'
  | 'modo_arredondamento'
  | 'precisao_round'
  | 'precisao_tributos'
  | 'precisao_valor'
  | 'preco_base'
  | 'versao_precificador'

export type ConfiguracoesPrecosSectionKey =
  | 'taxes'
  | 'rounding'
  | 'defaults'

export type ConfiguracoesPrecosFormValues = Record<ConfiguracoesPrecosFieldKey, string>

export type ConfiguracoesPrecosFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesPrecosOption = {
  value: string
  label: string
}

export type ConfiguracoesPrecosLookupCollections = {
  paymentMethods: ConfiguracoesPrecosOption[]
  paymentConditions: ConfiguracoesPrecosOption[]
  priceTables: ConfiguracoesPrecosOption[]
}

export type ConfiguracoesPrecosRecord = {
  values: ConfiguracoesPrecosFormValues
  metadata: Partial<Record<ConfiguracoesPrecosFieldKey, ConfiguracoesPrecosFieldMeta>>
  lookups: ConfiguracoesPrecosLookupCollections
}

export type ConfiguracoesPrecosFieldDefinition = {
  key: ConfiguracoesPrecosFieldKey
  section: ConfiguracoesPrecosSectionKey
  type: 'text' | 'enum' | 'lookup'
  label: string
  helper?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  options?: ConfiguracoesPrecosOption[]
  lookupCollection?: keyof ConfiguracoesPrecosLookupCollections
  lookupResource?: 'formas_pagamento' | 'condicoes_pagamento' | 'tabelas_preco'
}
