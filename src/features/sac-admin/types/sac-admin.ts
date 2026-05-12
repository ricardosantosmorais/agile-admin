export type SacStatus =
  | 'novo'
  | 'em_atendimento'
  | 'aguardando_cliente'
  | 'solucao_proposta'
  | 'resolvido_cliente'
  | 'fechado_inatividade'
  | 'reaberto'
  | 'pendentes_atuacao'
  | 'abertos'
  | 'fechados'
  | string

export type SacChartPoint = {
  label?: string | null
  total?: string | number | null
}

export type SacRawDashboardResponse = {
  data?: {
    periodo?: {
      data_inicial?: string | null
      data_final?: string | null
    } | null
    resumo?: Record<string, unknown> | null
    graficos?: {
      evolucao?: Array<Record<string, unknown>> | null
      status?: SacChartPoint[] | null
      areas?: SacChartPoint[] | null
      assuntos?: SacChartPoint[] | null
      responsaveis?: SacChartPoint[] | null
      fechamentos?: SacChartPoint[] | null
      idade_backlog?: SacChartPoint[] | null
    } | null
    rankings?: {
      clientes?: Array<Record<string, unknown>> | null
      atuacao?: Array<Record<string, unknown>> | null
    } | null
  } | null
}

export type SacDashboard = {
  period: {
    start: string
    end: string
  }
  summary: {
    opened: number
    closed: number
    backlog: number
    pendingAction: number
    firstResponseMinutes: number
    resolutionHours: number
    firstResponseSlaPercent: number
    resolutionSlaPercent: number
    reopened: number
    closedByCustomer: number
    closedByInactivity: number
  }
  charts: {
    evolution: Array<{ date: string; label: string; opened: number; closed: number }>
    status: Array<{ label: string; total: number }>
    areas: Array<{ label: string; total: number }>
    subjects: Array<{ label: string; total: number }>
    responsibles: Array<{ label: string; total: number }>
    closings: Array<{ label: string; total: number }>
    backlogAge: Array<{ label: string; total: number }>
  }
  rankings: {
    customers: Array<{ id: string; name: string; total: number }>
    pending: Array<{ id: string; protocol: string; title: string; areaName: string; lastInteractionAt: string }>
  }
}

export type SacRawTicket = Record<string, unknown>

export type SacTicket = {
  id: string
  protocol: string
  title: string
  status: SacStatus
  description: string
  customerName: string
  customerDocument: string
  areaName: string
  subjectName: string
  orderCode: string
  assigneeName: string
  createdAt: string
  updatedAt: string
  lastInteractionAt: string
  canReopen: boolean
  reopenUntil: string
}

export type SacTicketListResponse = {
  items: SacTicket[]
  meta: {
    page: number
    perPage: number
    total: number
    pages: number
  }
}

export type SacRawTicketListResponse = {
  data?: SacRawTicket[] | null
  meta?: {
    page?: string | number | null
    perpage?: string | number | null
    perPage?: string | number | null
    total?: string | number | null
    pages?: string | number | null
  } | null
}

export type SacAttachment = {
  id: string
  name: string
  url: string
}

export type SacMessage = {
  id: string
  authorType: string
  authorName: string
  message: string
  createdAt: string
  attachments: SacAttachment[]
}

export type SacEvent = {
  id: string
  type: string
  description: string
  createdAt: string
}

export type SacItem = {
  id: string
  sku: string
  productName: string
  quantity: number
}

export type SacRawTicketDetailResponse = {
  data?: {
    chamado?: SacRawTicket | null
    mensagens?: Array<Record<string, unknown>> | null
    eventos?: Array<Record<string, unknown>> | null
    itens?: Array<Record<string, unknown>> | null
    anexos?: Array<Record<string, unknown>> | null
  } | null
}

export type SacTicketDetail = {
  ticket: SacTicket
  messages: SacMessage[]
  events: SacEvent[]
  items: SacItem[]
  attachments: SacAttachment[]
}

export type SacAdminPermissions = {
  canViewDashboard: boolean
  canList: boolean
  canListAll?: boolean
  canView: boolean
  canRespond: boolean
  canAddInternalNote: boolean
  canChangeStatus: boolean
  canAssign?: boolean
  canTransfer?: boolean
  canConfigureAreas?: boolean
  canConfigureModule?: boolean
}

export type SacTicketAction = 'respond' | 'internal-note' | 'status' | 'assign' | 'transfer'

export type SacLookupOption = {
  id: string
  name: string
  active: boolean
}

export type SacModuleConfig = {
  active: boolean
  contracted: boolean
  allowedEmails: string
  autoCloseDays: number
  reopenDays: number
}

export type SacArea = SacLookupOption & {
  showResponsibleName: boolean
  slaHours: number
  totalTickets: number
}

export type SacSubject = {
  id: string
  areaId: string
  name: string
  active: boolean
  allowOrderLink: boolean
  requireOrder: boolean
  totalTickets: number
}

export type SacAreaResponsible = {
  id: string
  areaId: string
  userId: string
  userName: string
  userEmail: string
  active: boolean
}
