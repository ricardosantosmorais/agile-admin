export type ConfiguracoesClientesFieldKey =
  | 'campos_ocultos_cadastro_cliente'
  | 'checa_limite_credito'
  | 'exibe_limite'
  | 'forma_ativacao_cliente'
  | 'informa_idade'
  | 'informacao_inicial_cadastro'
  | 'qualquer_filial'
  | 'seleciona_entrega'
  | 'seleciona_filial'
  | 'seleciona_pagamento'
  | 'seleciona_preferencias'
  | 'seleciona_regiao'
  | 'seleciona_vendedor'
  | 'senha_forte'
  | 'tipo_cliente_ativacao'
  | 'tipo_cliente'
  | 'tipo_cliente_login'
  | 'permite_cadastro_cliente'
  | 'tipo_ecommerce'
  | 'tipo_cliente_padrao'
  | 'ufs_cadastro_cliente'
  | 'valida_cnae'
  | 'valida_vendedor'
  | 'vincula_tabela_preco'
  | 'altera_carrinho_vendedor'

export type ConfiguracoesClientesFormValues = Record<ConfiguracoesClientesFieldKey, string>

export type ConfiguracoesClientesFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesClientesRecord = {
  values: ConfiguracoesClientesFormValues
  metadata: Partial<Record<ConfiguracoesClientesFieldKey, ConfiguracoesClientesFieldMeta>>
}

export type ConfiguracoesClientesOption = {
  value: string
  labelKey: string
  fallbackLabel: string
}

export type ConfiguracoesClientesSectionKey =
  | 'registration'
  | 'experience'
  | 'rules'

export type ConfiguracoesClientesFieldDefinition = {
  key: ConfiguracoesClientesFieldKey
  section: ConfiguracoesClientesSectionKey
  type: 'text' | 'boolean' | 'enum'
  options?: ConfiguracoesClientesOption[]
}
