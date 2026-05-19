export type CatalogosDigitaisRawCatalog = Record<string, unknown>

export type CatalogosDigitaisRawResponse = {
  data?: CatalogosDigitaisRawCatalog[]
  meta?: Record<string, unknown>
  appStore?: CatalogosDigitaisRawAppStoreSummary
}

export type CatalogosDigitaisRawAppStoreSummary = {
  id?: string
  slug?: string
  nome?: string
  contratado?: boolean
  contratacao?: Record<string, unknown> | null
  status_contratacao?: string
  error?: Record<string, unknown> | string
}

export type CatalogosDigitaisCatalog = {
  id: string
  code: string
  name: string
  description: string
  status: string
  model: string
  template: string
  objective: string
  publicationMode: string
  publicUrl: string
  validFrom: string
  validTo: string
  productCount: number
  sectionCount: number
  showPrice: boolean
  published: boolean
  active: boolean
  updatedAt: string
  createdAt: string
}

export type CatalogosDigitaisAppStoreSummary = {
  moduleId: string
  contracted: boolean
  status: string
  error: string
}

export type CatalogosDigitaisListResponse = {
  items: CatalogosDigitaisCatalog[]
  meta: {
    page: number
    perPage: number
    total: number
    pages: number
  }
  appStore: CatalogosDigitaisAppStoreSummary
}

export type CatalogosDigitaisListFilters = {
  page?: number
  perpage?: number
  q?: string
  code?: string
  name?: string
  status?: string
  validFrom?: string
  validTo?: string
}

export type CatalogoDigitalFormRecord = {
  id: string
  code: string
  name: string
  coverCall: string
  model: string
  template: string
  objective: string
  publicationMode: string
  validFrom: string
  validTo: string
  showPrice: boolean
  active: boolean
  products: unknown[]
  sections: unknown[]
  snapshot: Record<string, unknown>
}

export type CatalogoDigitalProduct = {
  id: string
  codigo: string
  sku: string
  nome: string
  descricao: string
  marca: string
  imagem: string
  url: string
  ativo: boolean
  disponivel: boolean
  [key: string]: unknown
}

export type CatalogoDigitalCollection = {
  id: string
  codigo: string
  nome: string
}

export type CatalogoDigitalProductsResult = {
  data: CatalogoDigitalProduct[]
  meta?: Record<string, unknown>
  not_found?: string[]
  colecao?: CatalogoDigitalCollection
}

export type CatalogoDigitalPricingOption = {
  id: string
  codigo?: string
  nome: string
  indice?: string
}

export type CatalogoDigitalPricingOptions = {
  data: {
    filiais: CatalogoDigitalPricingOption[]
    formas_pagamento: CatalogoDigitalPricingOption[]
    condicoes_pagamento: CatalogoDigitalPricingOption[]
    tabelas_preco: CatalogoDigitalPricingOption[]
    modo_ecommerce: string
    cliente_padrao_codigo: string
  }
}

export type CatalogoDigitalPricingSnapshotResult = {
  payload: Record<string, unknown>
  meta?: {
    precificado?: boolean
    precificados?: number
    erros?: number
    rejeitados?: number
    motivo?: string
    [key: string]: unknown
  }
  errors?: CatalogoDigitalProduct[]
  rejected?: CatalogoDigitalProduct[]
}

export type CatalogoDigitalSectionType =
  | 'banner'
  | 'titulo'
  | 'produtos_grid'
  | 'produtos_lista'
  | 'texto'
  | 'cta'
  | 'divisor'
  | 'espacador'
  | 'quebra_pagina'

export type CatalogoDigitalSection = {
  id: string
  tipo: CatalogoDigitalSectionType
  modelo_secao: string
  titulo: string
  subtitulo: string
  banner_url: string
  background: string
  text_color: string
  accent: string
  padding_y: number
  font_size: number
  mostrar_preco: boolean
  produtos: string[]
  texto_html: string
  html_customizado: string
}
