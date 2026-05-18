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
