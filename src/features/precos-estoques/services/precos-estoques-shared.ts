import { formatLocalizedDecimal, parseLocalizedNumber } from '@/src/lib/value-parsers'

export const PRODUCT_BRANCH_STATUS_META = {
  disponivel: { label: 'Disponível', tone: 'success' as const },
  indisponivel: { label: 'Indisponível', tone: 'danger' as const },
  em_revisao: { label: 'Em revisão', tone: 'warning' as const },
  fora_de_linha: { label: 'Fora de linha', tone: 'neutral' as const },
}

export const TRIBUTOS_PARTILHA_CALCULATION_META = {
  base_dupla_por_dentro: 'Base dupla por dentro',
  base_dupla_por_fora: 'Base dupla por fora',
  base_diferenca: 'Base diferença',
  base_unica: 'Base única',
}

export function formatPriceStockDecimal(value: unknown, precision = 2) {
  return formatLocalizedDecimal(value, precision)
}

export function parsePriceStockDecimal(value: unknown) {
  return parseLocalizedNumber(value)
}
