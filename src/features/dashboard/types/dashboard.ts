export type DashboardRangeKey = 'mes_atual' | 'ultimos_30_dias' | 'ultimos_7_dias'

export type DashboardSnapshot = {
  rangeLabel: string
  primaryMetrics: Array<{
    label: string
    labelKey?: string
    value: number
    variation: number
    type?: 'currency' | 'number' | 'percent'
    tone?: 'emerald' | 'sky' | 'amber' | 'rose'
    description?: string
    descriptionKey?: string
    tooltip?: string
    tooltipKey?: string
  }>
  customerMetrics: Array<{
    label: string
    labelKey?: string
    value: number
    variation: number
    type?: 'currency' | 'number' | 'percent'
  }>
  serie: Array<Record<string, unknown>>
  ticketByDay: Array<Record<string, unknown>>
  channel: Array<Record<string, unknown>>
  emitente: Array<Record<string, unknown>>
  funil: Array<Record<string, unknown>>
  monitoringAlerts: string[]
  coorte: Array<Record<string, unknown>>
  topClients: Array<{
    nome: string
    pedidos: number
    valor: number
  }>
  topProducts: Array<{
    nome: string
    quantidade: number
    valor: number
  }>
  payments: Array<Record<string, unknown>>
  hourlyRevenue: Array<Record<string, unknown>>
  marketingMetrics: Array<{
    label: string
    labelKey?: string
    value: number
    variation: number
    type?: 'currency' | 'number' | 'percent'
    tone?: 'emerald' | 'sky' | 'amber' | 'rose'
    description?: string
    descriptionKey?: string
    tooltip?: string
    tooltipKey?: string
  }>
  marketingMixExclusive: Array<Record<string, unknown>>
  marketingMixInclusive: Array<Record<string, unknown>>
  marketingTicketComparison: Array<Record<string, unknown>>
  topCoupons: Array<Record<string, unknown>>
  topPromotions: Array<Record<string, unknown>>
}

export const dashboardPresets: Array<{ id: DashboardRangeKey; label: string; days: number }> = [
  { id: 'mes_atual', label: 'Mês atual', days: 30 },
  { id: 'ultimos_30_dias', label: 'Últimos 30 dias', days: 30 },
  { id: 'ultimos_7_dias', label: 'Últimos 7 dias', days: 7 },
]
