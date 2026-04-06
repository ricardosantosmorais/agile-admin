export type ConfiguracoesProdutosFieldKey =
  | 'aviseme'
  | 'comprar'
  | 'estoque'
  | 'exibe_estoque_assistente_pesquisa'
  | 'exibe_precos_filial'
  | 'exibicao_estoque'
  | 'exibicao_estoque_busca'
  | 'layout_padrao'
  | 'mecanismo_busca'
  | 'precisao_quantidade'
  | 'produtos_sem_imagem'
  | 'seleciona_embalagem'
  | 'setar_quantidade_maxima'
  | 'versao_restricao'

export type ConfiguracoesProdutosSectionKey =
  | 'catalog'
  | 'availability'
  | 'search'

export type ConfiguracoesProdutosFormValues = Record<ConfiguracoesProdutosFieldKey, string>

export type ConfiguracoesProdutosFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesProdutosOption = {
  value: string
  label: string
}

export type ConfiguracoesProdutosRecord = {
  values: ConfiguracoesProdutosFormValues
  metadata: Partial<Record<ConfiguracoesProdutosFieldKey, ConfiguracoesProdutosFieldMeta>>
}

export type ConfiguracoesProdutosFieldDefinition = {
  key: ConfiguracoesProdutosFieldKey
  section: ConfiguracoesProdutosSectionKey
  type: 'text' | 'enum'
  label: string
  helper?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  options?: ConfiguracoesProdutosOption[]
}
