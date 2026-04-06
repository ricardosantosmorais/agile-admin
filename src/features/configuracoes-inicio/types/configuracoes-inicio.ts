export type ConfiguracoesInicioFieldKey =
  | 'id_cliente_inicio'
  | 'coluna_preco_inicio'
  | 'id_filial_inicio'
  | 'id_forma_pagamento_inicio'
  | 'id_condicao_pagamento_inicio'
  | 'desconto_pix'
  | 'id_tabela_preco_inicio'
  | 'informa_cep_localizacao'
  | 'tipo_forma_pagamento_inicio'

export type ConfiguracoesInicioSectionKey =
  | 'navigation'
  | 'pricing'
  | 'payment'

export type ConfiguracoesInicioFormValues = Record<ConfiguracoesInicioFieldKey, string>

export type ConfiguracoesInicioFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesInicioOption = {
  value: string
  labelKey?: string
  fallbackLabel: string
}

export type ConfiguracoesInicioLookupCollections = {
  branches: ConfiguracoesInicioOption[]
  paymentMethods: ConfiguracoesInicioOption[]
  paymentConditions: ConfiguracoesInicioOption[]
  priceTables: ConfiguracoesInicioOption[]
}

export type ConfiguracoesInicioRecord = {
  values: ConfiguracoesInicioFormValues
  metadata: Partial<Record<ConfiguracoesInicioFieldKey, ConfiguracoesInicioFieldMeta>>
  lookups: ConfiguracoesInicioLookupCollections
}

export type ConfiguracoesInicioFieldDefinition = {
  key: ConfiguracoesInicioFieldKey
  section: ConfiguracoesInicioSectionKey
  type: 'text' | 'enum' | 'lookup'
  lookupCollection?: keyof ConfiguracoesInicioLookupCollections
  lookupResource?: 'filiais' | 'formas_pagamento' | 'condicoes_pagamento' | 'tabelas_preco'
  inputMode?: 'text' | 'numeric' | 'decimal'
  options?: ConfiguracoesInicioOption[]
}
