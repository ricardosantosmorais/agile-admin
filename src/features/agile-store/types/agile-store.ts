export type AgileStoreRawModule = {
  id?: string | number | null
  nome?: string | null
  tipo?: string | null
  resumo?: string | null
  descricao?: string | null
  preco?: string | number | null
  moeda?: string | null
  ciclo_cobranca?: string | null
  cor_primaria?: string | null
  icone?: string | null
  imagem_capa_url?: string | null
  metadata?: {
    beneficios?: unknown
    [key: string]: unknown
  } | null
  teste_gratis?: {
    disponivel?: boolean | number | string | null
    dias?: string | number | null
  } | null
  contratacao?: {
    status?: string | null
    [key: string]: unknown
  } | null
  acoes?: Record<string, AgileStoreActionPolicy | undefined> | null
  midias?: AgileStoreRawMedia[] | null
  historico?: AgileStoreRawHistoryItem[] | null
}

export type AgileStoreRawMedia = {
  tipo?: string | null
  url?: string | null
  titulo?: string | null
  descricao?: string | null
}

export type AgileStoreRawHistoryItem = {
  id?: string | number | null
  acao?: string | null
  status?: string | null
  created_at?: string | null
  message?: string | null
}

export type AgileStoreActionPolicy = {
  permitido?: boolean | null
  message?: string | null
}

export type AgileStoreRawListResponse = {
  data?: AgileStoreRawModule[] | null
  meta?: {
    page?: string | number | null
    perpage?: string | number | null
    perPage?: string | number | null
    total?: string | number | null
    pages?: string | number | null
    summary?: {
      total_modulos?: string | number | null
      total_contratados?: string | number | null
    } | null
  } | null
  filters?: {
    tipos?: unknown
  } | null
}

export type AgileStoreContractStatus =
  | 'ativo'
  | 'pendente_ativacao'
  | 'pendente_desativacao'
  | 'cancelado'
  | 'falha_ativacao'
  | 'falha_desativacao'
  | ''

export type AgileStoreAction = 'contract' | 'cancel' | 'retry'

export type AgileStorePermissions = {
  canContract: boolean
  canCancel: boolean
}

export type AgileStoreModule = {
  id: string
  name: string
  type: string
  summary: string
  description: string
  price: number
  currency: string
  billingCycle: string
  primaryColor: string
  icon: string
  coverImageUrl: string
  benefits: string[]
  trial: {
    available: boolean
    days: number
  }
  contractStatus: AgileStoreContractStatus
  actions: Record<string, AgileStoreActionPolicy | undefined>
  media: AgileStoreMedia[]
  history: AgileStoreHistoryItem[]
}

export type AgileStoreMedia = {
  type: string
  url: string
  title: string
  description: string
}

export type AgileStoreHistoryItem = {
  id: string
  action: string
  status: string
  createdAt: string
  message: string
}

export type AgileStoreListResponse = {
  items: AgileStoreModule[]
  meta: {
    page: number
    perPage: number
    total: number
    pages: number
  }
  summary: {
    totalModules: number
    activeContracts: number
  }
  filters: {
    types: string[]
  }
}
