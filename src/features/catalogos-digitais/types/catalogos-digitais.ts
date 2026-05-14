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
