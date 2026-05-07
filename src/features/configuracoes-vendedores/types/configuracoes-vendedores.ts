export type ConfiguracoesVendedoresBaseFieldKey =
  | 'associa_vendedor_cliente'
  | 'exibe_precos_cliente'
  | 'forma_ativacao_vendedor'
  | 'menu_acesso_vendedor'
  | 'permite_acesso_vendedor'
  | 'permite_cadastro_cliente_vendedor'
  | 'permite_desconto_vendedor'
  | 'tipo_cliente'
  | 'tipo_vendedor'
  | 'tipo_vendedor_padrao'
  | 'altera_carrinho_cliente'
  | 'area_representante'
  | 'preco_flexivel'
  | 'acrescimo_maximo'
  | 'desconto_maximo'
  | 'quantidade_cotas_vendedor'

export type ConfiguracoesVendedoresScheduleFieldKey =
  | 'acesso_vendedor_0'
  | 'acesso_vendedor_0_de'
  | 'acesso_vendedor_0_ate'
  | 'acesso_vendedor_1'
  | 'acesso_vendedor_1_de'
  | 'acesso_vendedor_1_ate'
  | 'acesso_vendedor_2'
  | 'acesso_vendedor_2_de'
  | 'acesso_vendedor_2_ate'
  | 'acesso_vendedor_3'
  | 'acesso_vendedor_3_de'
  | 'acesso_vendedor_3_ate'
  | 'acesso_vendedor_4'
  | 'acesso_vendedor_4_de'
  | 'acesso_vendedor_4_ate'
  | 'acesso_vendedor_5'
  | 'acesso_vendedor_5_de'
  | 'acesso_vendedor_5_ate'
  | 'acesso_vendedor_6'
  | 'acesso_vendedor_6_de'
  | 'acesso_vendedor_6_ate'

export type ConfiguracoesVendedoresFieldKey =
  | ConfiguracoesVendedoresBaseFieldKey
  | ConfiguracoesVendedoresScheduleFieldKey

export type ConfiguracoesVendedoresSectionKey =
  | 'access'
  | 'rules'
  | 'types'
  | 'representativeArea'
  | 'availability'

export type ConfiguracoesVendedoresFormValues = Record<ConfiguracoesVendedoresFieldKey, string>

export type ConfiguracoesVendedoresFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesVendedoresOption = {
  value: string
  label: string
}

export type ConfiguracoesVendedoresRecord = {
  values: ConfiguracoesVendedoresFormValues
  metadata: Partial<Record<ConfiguracoesVendedoresFieldKey, ConfiguracoesVendedoresFieldMeta>>
}

export type ConfiguracoesVendedoresFieldDefinition = {
  key: ConfiguracoesVendedoresBaseFieldKey
  section: Exclude<ConfiguracoesVendedoresSectionKey, 'availability'>
  type: 'enum' | 'decimal' | 'integer'
  label: string
  helper?: string
  options?: ConfiguracoesVendedoresOption[]
  visibleWhenAreaV2?: boolean
  masterOnly?: boolean
  masterOnlyEdit?: boolean
}

export type ConfiguracoesVendedoresScheduleDay = {
  dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6
  label: string
  helper: string
  toggleKey: Extract<ConfiguracoesVendedoresScheduleFieldKey, `acesso_vendedor_${number}`>
  fromKey: Extract<ConfiguracoesVendedoresScheduleFieldKey, `acesso_vendedor_${number}_de`>
  toKey: Extract<ConfiguracoesVendedoresScheduleFieldKey, `acesso_vendedor_${number}_ate`>
}
