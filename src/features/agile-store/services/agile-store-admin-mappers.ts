import type {
  AgileStoreAdminCustomer,
  AgileStoreAdminDashboard,
  AgileStoreAdminDashboardRawResponse,
  AgileStoreAdminEvent,
  AgileStoreAdminModuleMetric,
  AgileStoreAdminModuleOption,
  AgileStoreAdminTrendPoint,
  AgileStoreAdminVisit,
} from '@/src/features/agile-store/types/agile-store'

function text(value: unknown) {
  return String(value ?? '').trim()
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function array(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(object) : []
}

function billingStatus(row: Record<string, unknown>) {
  return text(row.faturamento_status_efetivo || row.faturamento_status) || 'pendente'
}

function expectedBillingStatus(status: string): 'faturado' | 'cancelado' {
  return ['pendente_desativacao', 'falha_desativacao', 'cancelado'].includes(status) ? 'cancelado' : 'faturado'
}

function normalizeModuleOption(row: Record<string, unknown>): AgileStoreAdminModuleOption {
  return {
    id: text(row.id),
    name: text(row.nome || row.name),
  }
}

function normalizeModule(row: Record<string, unknown>): AgileStoreAdminModuleMetric {
  return {
    ...normalizeModuleOption(row),
    type: text(row.tipo),
    status: text(row.status),
    highlighted: boolean(row.destaque),
    icon: text(row.icone),
    primaryColor: text(row.cor_primaria) || '#39aba4',
    visits: number(row.visitas),
    periodContracts: number(row.contratacoes_periodo),
    periodCancellations: number(row.descontratacoes_periodo),
    activeContracts: number(row.contratos_ativos),
    freeContracts: number(row.gratuitos_ativos),
    failures: number(row.falhas),
    mrr: number(row.mrr),
    conversion: number(row.conversao),
    growth: number(row.crescimento),
  }
}

function normalizeTrend(row: Record<string, unknown>): AgileStoreAdminTrendPoint {
  return {
    label: text(row.label),
    visits: number(row.visitas),
    conversions: number(row.conversoes),
    cancellations: number(row.cancelamentos),
  }
}

function normalizeVisit(row: Record<string, unknown>): AgileStoreAdminVisit {
  const conversionStatus = text(row.status_conversao) || (boolean(row.cancelado) ? 'cancelado' : boolean(row.convertido) ? 'convertido' : 'visita')
  return {
    id: text(row.id),
    companyName: text(row.empresa_nome || row.id_empresa),
    companyDocument: text(row.empresa_cnpj || row.empresa_codigo || row.id_empresa),
    moduleName: text(row.modulo_nome),
    moduleType: text(row.modulo_tipo),
    userName: text(row.usuario || row.nome_usuario),
    userEmail: text(row.email_usuario),
    visitedAt: text(row.visitado_em || row.created_at),
    ip: text(row.ip),
    conversionStatus,
  }
}

function normalizeCustomer(row: Record<string, unknown>): AgileStoreAdminCustomer {
  const status = text(row.status)
  return {
    id: text(row.id),
    companyName: text(row.empresa_nome || row.id_empresa),
    companyDocument: text(row.empresa_cnpj || row.empresa_codigo || row.id_empresa),
    moduleName: text(row.modulo_nome),
    moduleType: text(row.modulo_tipo),
    status,
    value: number(row.valor_contratado),
    currency: text(row.moeda) || 'BRL',
    billingCycle: text(row.ciclo_cobranca) || 'mensal',
    trialDays: number(row.teste_gratis_dias),
    trialUntil: text(row.teste_gratis_ate),
    firstBillingAt: text(row.primeira_cobranca_em),
    billingDay: text(row.dia_faturamento),
    billingStatus: billingStatus(row),
    expectedBillingStatus: expectedBillingStatus(status),
    contractedAt: text(row.contratado_em),
    contractedBy: text(row.contratado_por || row.contratado_por_email),
    canCancelContract: status === 'ativo',
  }
}

function normalizeEvent(row: Record<string, unknown>): AgileStoreAdminEvent {
  return {
    id: text(row.id),
    action: text(row.acao),
    moduleName: text(row.modulo_nome),
    companyName: text(row.empresa_nome || row.id_empresa),
    userName: text(row.usuario || row.nome_usuario || row.email_usuario),
    createdAt: text(row.created_at),
    ip: text(row.ip),
  }
}

export function normalizeAgileStoreAdminDashboard(response: AgileStoreAdminDashboardRawResponse): AgileStoreAdminDashboard {
  const data = object(response.data)
  const period = object(data.periodo)
  const summary = object(data.summary)

  return {
    period: {
      scope: text(period.escopo) || 'periodo',
      start: text(period.inicio),
      end: text(period.fim),
      granularity: text(period.granularidade || data.trend_granularity),
    },
    summary: {
      modules: number(summary.modulos),
      visits: number(summary.visitas),
      visitorCompanies: number(summary.empresas_visitantes),
      periodContracts: number(summary.contratacoes_periodo),
      periodCancellations: number(summary.descontratacoes_periodo),
      activeContracts: number(summary.contratos_ativos),
      freeContracts: number(summary.gratuitos_ativos),
      failures: number(summary.falhas),
      mrr: number(summary.mrr),
    },
    moduleOptions: array(data.module_options).map(normalizeModuleOption).filter((item) => item.id && item.name),
    modules: array(data.modules).map(normalizeModule).filter((item) => item.id && item.name),
    trend: array(data.trend).map(normalizeTrend),
    visits: array(data.visits).map(normalizeVisit),
    customers: array(data.customers).map(normalizeCustomer).filter((item) => item.id),
    events: array(data.events).map(normalizeEvent),
  }
}
