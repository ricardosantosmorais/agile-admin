import type { CrudRecord } from '@/src/components/crud-base/types'
import { formatApiDateToInput, formatInputDateToApiEnd, formatInputDateToApiStart } from '@/src/lib/date-input'
import { formatLocalizedDecimal, parseInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'

export { formatApiDateToInput, formatInputDateToApiEnd, formatInputDateToApiStart }

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function parseIntegerOrZero(value: unknown) {
  return parseInteger(value) ?? 0
}

export function parseMoneyValue(value: unknown) {
  const normalized = normalizeString(value).replace(/[^\d,.-]/g, '')
  if (!normalized) {
    return null
  }

  return parseLocalizedNumber(normalized)
}

export function formatMoneyInput(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) {
    return ''
  }

  return formatLocalizedDecimal(parsed, 2)
}

export function getCouponTypeLabel(type: unknown) {
  switch (normalizeString(type)) {
    case 'percentual':
      return 'Percentual'
    case 'frete_gratis':
      return 'Frete grátis'
    case 'valor_fixo':
      return 'Valor fixo'
    default:
      return '-'
  }
}

export function getCouponAvailabilityStatus(record: CrudRecord) {
  const today = new Date().toISOString().slice(0, 10)
  const start = formatApiDateToInput(record.data_inicio)
  const end = formatApiDateToInput(record.data_fim)

  if (start && start > today) {
    return 'upcoming' as const
  }

  if (end && end < today) {
    return 'expired' as const
  }

  return 'available' as const
}

export function getCouponValueLabel(record: CrudRecord) {
  const type = normalizeString(record.tipo)
  const value = typeof record.valor === 'number' ? record.valor : parseMoneyValue(record.valor)

  if (type === 'frete_gratis') {
    return 'Frete grátis'
  }

  if (value === null) {
    return '-'
  }

  if (type === 'percentual') {
    return `${formatMoneyInput(value)}%`
  }

  return `R$ ${formatMoneyInput(value)}`
}

export function normalizeCupomDescontoRecord(record: CrudRecord): CrudRecord {
  const formaPagamento = (record.forma_pagamento && typeof record.forma_pagamento === 'object'
    ? record.forma_pagamento
    : null) as { id?: unknown; nome?: unknown } | null
  const condicaoPagamento = (record.condicao_pagamento && typeof record.condicao_pagamento === 'object'
    ? record.condicao_pagamento
    : null) as { id?: unknown; nome?: unknown } | null

  const formaPagamentoId = normalizeString(record.id_forma_pagamento || formaPagamento?.id)
  const formaPagamentoLabel = normalizeString(formaPagamento?.nome)
  const condicaoPagamentoId = normalizeString(record.id_condicao_pagamento || condicaoPagamento?.id)
  const condicaoPagamentoLabel = normalizeString(condicaoPagamento?.nome)

  return {
    ...record,
    ativo: normalizeBoolean(record.ativo),
    primeiro_pedido: normalizeBoolean(record.primeiro_pedido),
    uso_unico: normalizeBoolean(record.uso_unico),
    app: normalizeBoolean(record.app),
    prazo_medio: normalizeBoolean(record.prazo_medio),
    aplica_automatico: normalizeBoolean(record.aplica_automatico),
    codigo: normalizeString(record.codigo),
    codigo_erp: normalizeString(record.codigo_erp),
    nome: normalizeString(record.nome),
    tipo: normalizeString(record.tipo),
    perfil: normalizeString(record.perfil),
    uso_promocao: String(record.uso_promocao ?? '0'),
    data_inicio: formatApiDateToInput(record.data_inicio),
    data_fim: formatApiDateToInput(record.data_fim),
    percentual: normalizeString(record.tipo) === 'percentual' ? formatMoneyInput(record.valor) : '',
    valor_fixo: normalizeString(record.tipo) === 'valor_fixo' ? formatMoneyInput(record.valor) : '',
    valor_maximo: formatMoneyInput(record.valor_maximo),
    pedido_minimo: formatMoneyInput(record.pedido_minimo),
    pedido_maximo: formatMoneyInput(record.pedido_maximo),
    usos: String(record.usos ?? '0'),
    limite_usos: String(record.limite_usos ?? '0'),
    itens_distintos: record.itens_distintos === null || record.itens_distintos === undefined ? '' : String(record.itens_distintos),
    prazo_medio_pagamento: record.prazo_medio_pagamento === null || record.prazo_medio_pagamento === undefined ? '' : String(record.prazo_medio_pagamento),
    id_forma_pagamento: formaPagamentoId,
    id_condicao_pagamento: condicaoPagamentoId,
    id_forma_pagamento_lookup: formaPagamentoId ? { id: formaPagamentoId, label: formaPagamentoLabel || formaPagamentoId } : null,
    id_condicao_pagamento_lookup: condicaoPagamentoId ? { id: condicaoPagamentoId, label: condicaoPagamentoLabel || condicaoPagamentoId } : null,
  }
}

export function toCupomDescontoPayload(record: CrudRecord): CrudRecord {
  const type = normalizeString(record.tipo)
  const percentageValue = parseMoneyValue(record.percentual)
  const fixedValue = parseMoneyValue(record.valor_fixo)
  const averageTermPayment = parseIntegerOrZero(record.prazo_medio_pagamento)
  const value = type === 'percentual'
    ? percentageValue
    : type === 'valor_fixo'
      ? fixedValue
      : null

  if (!type) {
    throw new Error('Selecione o tipo do cupom.')
  }

  if (type === 'percentual' && value === null) {
    throw new Error('Informe o percentual do cupom.')
  }

  if (type === 'valor_fixo' && value === null) {
    throw new Error('Informe o valor fixo do cupom.')
  }

  const startDate = formatInputDateToApiStart(record.data_inicio)
  const endDate = formatInputDateToApiEnd(record.data_fim)
  if (!startDate || !endDate) {
    throw new Error('Informe o período de vigência do cupom.')
  }

  if (String(record.data_inicio || '') > String(record.data_fim || '')) {
    throw new Error('A data fim deve ser maior ou igual à data início.')
  }

  return {
    id: normalizeString(record.id) || undefined,
    ativo: record.ativo === true,
    primeiro_pedido: record.primeiro_pedido === true,
    uso_unico: record.uso_unico === true,
    app: record.app === true,
    prazo_medio: record.prazo_medio === true,
    aplica_automatico: type === 'percentual' && record.aplica_automatico === true,
    codigo: normalizeString(record.codigo),
    codigo_erp: normalizeString(record.codigo_erp) || null,
    nome: normalizeString(record.nome),
    tipo: type,
    valor: value,
    perfil: normalizeString(record.perfil),
    uso_promocao: type !== 'percentual'
      ? 0
      : normalizeString(record.uso_promocao) === '2'
      ? 2
      : normalizeString(record.uso_promocao) === '1'
        ? 1
        : 0,
    data_inicio: startDate,
    data_fim: endDate,
    valor_maximo: type === 'percentual' ? parseMoneyValue(record.valor_maximo) : null,
    pedido_minimo: parseMoneyValue(record.pedido_minimo),
    pedido_maximo: parseMoneyValue(record.pedido_maximo),
    usos: undefined,
    limite_usos: parseInteger(record.limite_usos) ?? 0,
    itens_distintos: parseInteger(record.itens_distintos),
    prazo_medio_pagamento: averageTermPayment,
    id_forma_pagamento: normalizeString(record.id_forma_pagamento) || null,
    id_condicao_pagamento: averageTermPayment > 0 ? null : normalizeString(record.id_condicao_pagamento) || null,
    percentual: undefined,
    valor_fixo: undefined,
  }
}
