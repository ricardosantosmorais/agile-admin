import type { TranslationParams } from '@/src/i18n/types'
import { normalizeSearchValue } from '@/src/lib/text-normalization'

const METRIC_LABEL_KEYS: Record<string, string> = {
  'total de vendas': 'dashboard.metricLabels.totalVendas',
  'numero de pedidos': 'dashboard.metricLabels.numeroPedidos',
  'número de pedidos': 'dashboard.metricLabels.numeroPedidos',
  'ticket medio': 'dashboard.metricLabels.ticketMedio',
  'ticket médio': 'dashboard.metricLabels.ticketMedio',
  'taxa de conversao': 'dashboard.metricLabels.taxaConversao',
  'taxa de conversão': 'dashboard.metricLabels.taxaConversao',
  'novos clientes': 'dashboard.metricLabels.novosClientes',
  'clientes ativos': 'dashboard.metricLabels.clientesAtivos',
  'taxa de recompra': 'dashboard.metricLabels.taxaRecompra',
  'ltv medio': 'dashboard.metricLabels.ltvMedio',
  'ltv médio': 'dashboard.metricLabels.ltvMedio',
  'pedidos incentivados': 'dashboard.metricLabels.pedidosIncentivados',
  'itens incentivados': 'dashboard.metricLabels.itensIncentivados',
  'qtd. pedidos com incentivo': 'dashboard.metricLabels.qtdPedidosComIncentivo',
  '% da receita com incentivo': 'dashboard.metricLabels.receitaComIncentivo',
}

const METRIC_DESCRIPTION_KEYS: Record<string, string> = {
  'receita total dos pedidos validos no periodo selecionado.': 'dashboard.metricDescriptions.totalVendas',
  'receita total dos pedidos válidos no período selecionado.': 'dashboard.metricDescriptions.totalVendas',
  'quantidade de pedidos validos no periodo selecionado.': 'dashboard.metricDescriptions.numeroPedidos',
  'quantidade de pedidos válidos no período selecionado.': 'dashboard.metricDescriptions.numeroPedidos',
  'valor medio por pedido valido no periodo selecionado.': 'dashboard.metricDescriptions.ticketMedio',
  'valor médio por pedido válido no período selecionado.': 'dashboard.metricDescriptions.ticketMedio',
  'percentual de aproveitamento do funil no periodo selecionado.': 'dashboard.metricDescriptions.taxaConversao',
  'percentual de pedidos válidos sobre a base de intenção de compra.': 'dashboard.metricDescriptions.taxaConversao',
}

export function translateDashboardMetricLabel(
  label: string,
  t: (key: string, fallback?: string, params?: TranslationParams) => string,
) {
  const key = METRIC_LABEL_KEYS[normalizeSearchValue(label)]
  return key ? t(key, label) : label
}

export function translateDashboardMetricDescription(
  description: string | undefined,
  t: (key: string, fallback?: string, params?: TranslationParams) => string,
) {
  if (!description) {
    return description
  }

  const key = METRIC_DESCRIPTION_KEYS[normalizeSearchValue(description)]
  return key ? t(key, description) : description
}

export function translateDashboardPresetLabel(
  presetId: string,
  fallback: string,
  t: (key: string, fallback?: string, params?: TranslationParams) => string,
) {
  return t(`dashboard.presets.${presetId}`, fallback)
}
