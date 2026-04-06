export type ConfiguracoesEntregasFieldKey =
  | 'aplica_frete_tributos'
  | 'calcula_frete'
  | 'divide_frete'
  | 'id_forma_entrega_padrao'
  | 'cobra_frete_unico'
  | 'informa_cep'
  | 'informa_endereco'
  | 'multi_encomenda'
  | 'multi_endereco'
  | 'pessoa_retirada'
  | 'rateio_frete_produtos'
  | 'frete_unico'
  | 'frete_unico_multi_encomenda'

export type ConfiguracoesEntregasFormValues = Record<ConfiguracoesEntregasFieldKey, string>

export type ConfiguracoesEntregasFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesEntregasOption = {
  value: string
  labelKey?: string
  fallbackLabel: string
}

export type ConfiguracoesEntregasRecord = {
  values: ConfiguracoesEntregasFormValues
  metadata: Partial<Record<ConfiguracoesEntregasFieldKey, ConfiguracoesEntregasFieldMeta>>
  deliveryMethods: ConfiguracoesEntregasOption[]
}

export type ConfiguracoesEntregasSectionKey =
  | 'freight'
  | 'checkout'
  | 'split'

export type ConfiguracoesEntregasFieldDefinition = {
  key: ConfiguracoesEntregasFieldKey
  section: ConfiguracoesEntregasSectionKey
  type: 'text' | 'boolean' | 'enum'
  options?: ConfiguracoesEntregasOption[]
  includeEmptyOption?: boolean
}
