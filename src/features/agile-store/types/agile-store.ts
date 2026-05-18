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
  poster?: string | null
  poster_url?: string | null
}

export type AgileStoreRawHistoryItem = {
  id?: string | number | null
  acao?: string | null
  status?: string | null
  created_at?: string | null
  message?: string | null
  usuario?: string | null
  ip?: string | null
  valor?: string | number | null
  moeda?: string | null
  teste_gratis_ate?: string | null
  erro?: string | null
  feedback_motivo?: string | null
  feedback_mensagem?: string | null
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

export type AgileStoreRawDetailResponse = AgileStoreRawModule | {
  data?: AgileStoreRawModule | null
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
  posterUrl: string
}

export type AgileStoreHistoryItem = {
  id: string
  action: string
  status: string
  createdAt: string
  message: string
  userName: string
  ip: string
  value: number
  currency: string
  trialUntil: string
  error: string
  feedbackMotive: string
  feedbackMessage: string
}

export type AgileStoreActionFeedback = {
  motive?: string
  message?: string
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

export type AgileStoreAdminDashboardRawResponse = {
  data?: Record<string, unknown> | null
}

export type AgileStoreAdminPeriod = {
  scope: string
  start: string
  end: string
  granularity: string
}

export type AgileStoreAdminSummary = {
  modules: number
  visits: number
  visitorCompanies: number
  periodContracts: number
  periodCancellations: number
  activeContracts: number
  freeContracts: number
  failures: number
  mrr: number
}

export type AgileStoreAdminModuleOption = {
  id: string
  name: string
}

export type AgileStoreAdminModuleMetric = AgileStoreAdminModuleOption & {
  type: string
  status: string
  highlighted: boolean
  icon: string
  primaryColor: string
  visits: number
  periodContracts: number
  periodCancellations: number
  activeContracts: number
  freeContracts: number
  failures: number
  mrr: number
  conversion: number
  growth: number
}

export type AgileStoreAdminTrendPoint = {
  label: string
  visits: number
  conversions: number
  cancellations: number
}

export type AgileStoreAdminVisit = {
  id: string
  companyName: string
  companyDocument: string
  moduleName: string
  moduleType: string
  userName: string
  userEmail: string
  visitedAt: string
  ip: string
  conversionStatus: string
}

export type AgileStoreAdminCustomer = {
  id: string
  companyName: string
  companyDocument: string
  moduleName: string
  moduleType: string
  status: string
  value: number
  currency: string
  billingCycle: string
  trialDays: number
  trialUntil: string
  firstBillingAt: string
  billingDay: string
  billingStatus: string
  expectedBillingStatus: 'faturado' | 'cancelado'
  contractedAt: string
  contractedBy: string
  canCancelContract: boolean
  feedbackMotive: string
  feedbackMessage: string
}

export type AgileStoreAdminEvent = {
  id: string
  action: string
  moduleName: string
  companyName: string
  userName: string
  createdAt: string
  ip: string
  feedbackMotive: string
  feedbackMessage: string
}

export type AgileStoreAdminDashboard = {
  period: AgileStoreAdminPeriod
  summary: AgileStoreAdminSummary
  moduleOptions: AgileStoreAdminModuleOption[]
  modules: AgileStoreAdminModuleMetric[]
  trend: AgileStoreAdminTrendPoint[]
  visits: AgileStoreAdminVisit[]
  customers: AgileStoreAdminCustomer[]
  events: AgileStoreAdminEvent[]
}
