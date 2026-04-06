export type ConfiguracoesLayoutFieldKey =
  | 'logomarca'
  | 'ico'
  | 'css'
  | 'barra-topo'
  | 'barra-topo-mobile'
  | 'barra-menu'
  | 'barra-menu-mobile'
  | 'barra-newsletter'
  | 'barra-servicos'
  | 'barra-rodape'
  | 'meta_titulo'
  | 'meta_palavras_chave'
  | 'meta_descricao'

export type ConfiguracoesLayoutAreaKey =
  | 'branding'
  | 'theme'
  | 'top'
  | 'menu'
  | 'newsletter'
  | 'services'
  | 'footer'
  | 'seo'

export type ConfiguracoesLayoutViewport = 'desktop' | 'mobile'

export type ConfiguracoesLayoutFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesLayoutFormValues = Record<ConfiguracoesLayoutFieldKey, string>

export type ConfiguracoesLayoutRecord = {
  values: ConfiguracoesLayoutFormValues
  metadata: Partial<Record<ConfiguracoesLayoutFieldKey, ConfiguracoesLayoutFieldMeta>>
  company: {
    id: string
    logo: string
    logoAlt: string
    ico: string
    bucketUrl: string
  }
}

export type ConfiguracoesLayoutAreaDefinition = {
  key: ConfiguracoesLayoutAreaKey
  fieldKeys: ConfiguracoesLayoutFieldKey[]
  supportsViewport?: boolean
}
