import type { CrudRecord } from '@/src/components/crud-base/types'
import { formatApiDateToInput, formatInputDateToApiEnd, formatInputDateToApiStart } from '@/src/lib/date-input'
import { parseCurrencyInput } from '@/src/lib/input-masks'
import { parseInteger } from '@/src/lib/value-parsers'

export type CampanhaTipo = 'leve_pague' | 'desconto_unidade' | 'compre_junto'

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function parseDiscount(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = parseCurrencyInput(normalizeString(value))
  return parsed === null ? null : parsed
}

export function normalizeCampanhaRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: normalizeBoolean(record.ativo),
    codigo: normalizeString(record.codigo),
    nome: normalizeString(record.nome),
    tipo: normalizeString(record.tipo),
    quantidade_pedido: record.quantidade_pedido === null || record.quantidade_pedido === undefined ? '' : String(record.quantidade_pedido),
    quantidade_pagamento: record.quantidade_pagamento === null || record.quantidade_pagamento === undefined ? '' : String(record.quantidade_pagamento),
    quantidade_maxima: record.quantidade_maxima === null || record.quantidade_maxima === undefined ? '' : String(record.quantidade_maxima),
    desconto: record.desconto === null || record.desconto === undefined ? '' : String(record.desconto).replace('.', ','),
    data_inicio: formatApiDateToInput(record.data_inicio),
    data_fim: formatApiDateToInput(record.data_fim),
  }
}

export function toCampanhaPayload(record: CrudRecord, tipo: CampanhaTipo): CrudRecord {
  const nome = normalizeString(record.nome)
  const dataInicio = formatInputDateToApiStart(record.data_inicio)
  const dataFim = formatInputDateToApiEnd(record.data_fim)

  if (!nome) {
    throw new Error('Informe o nome da campanha.')
  }

  if (record.data_inicio && record.data_fim && String(record.data_inicio) > String(record.data_fim)) {
    throw new Error('A data fim deve ser maior ou igual à data início.')
  }

  const payload: CrudRecord = {
    id: normalizeString(record.id) || undefined,
    codigo: normalizeString(record.codigo) || null,
    nome,
    tipo,
    ativo: normalizeBoolean(record.ativo),
    data_inicio: dataInicio,
    data_fim: dataFim,
  }

  if (tipo === 'leve_pague') {
    const quantidadePedido = parseInteger(record.quantidade_pedido)
    const quantidadePagamento = parseInteger(record.quantidade_pagamento)
    if (!quantidadePedido || quantidadePedido < 2) {
      throw new Error('Informe um valor válido para Leve.')
    }
    if (!quantidadePagamento || quantidadePagamento < 1) {
      throw new Error('Informe um valor válido para Pague.')
    }
    if (quantidadePagamento >= quantidadePedido) {
      throw new Error('O valor de Pague deve ser menor que Leve.')
    }

    payload.quantidade_pedido = quantidadePedido
    payload.quantidade_pagamento = quantidadePagamento
    payload.quantidade_maxima = parseInteger(record.quantidade_maxima)
    return payload
  }

  if (tipo === 'desconto_unidade') {
    const quantidadePedido = parseInteger(record.quantidade_pedido)
    const desconto = parseDiscount(record.desconto)
    if (!quantidadePedido || quantidadePedido < 1) {
      throw new Error('Informe uma quantidade válida.')
    }
    if (desconto === null) {
      throw new Error('Informe o desconto da campanha.')
    }

    payload.quantidade_pedido = quantidadePedido
    payload.quantidade_maxima = parseInteger(record.quantidade_maxima)
    payload.desconto = desconto
    return payload
  }

  return payload
}

export function createCampanhaProdutoPayloads(campanhaId: string, rawIds: string) {
  const ids = rawIds
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return ids.map((id, index) => ({
    id_campanha: campanhaId,
    id_produto: id,
    posicao: index + 1,
  }))
}

export function splitCampanhaProdutoTokens(rawIds: string) {
  return rawIds
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createCompreJuntoProdutoPayload(campanhaId: string, record: CrudRecord) {
  const idProduto = normalizeString(record.id_produto)
  if (!idProduto) {
    throw new Error('Selecione o produto.')
  }

  const tipo = normalizeString(record.tipo)
  if (tipo !== 'percentual' && tipo !== 'valor_fixo') {
    throw new Error('Selecione o tipo do desconto.')
  }

  const valor = parseDiscount(record.valor)
  if (valor === null) {
    throw new Error('Informe o valor do desconto.')
  }

  return [{
    id_campanha: campanhaId,
    id_produto: idProduto,
    principal: normalizeBoolean(record.principal),
    aplica_tributos: normalizeBoolean(record.aplica_tributos),
    tipo,
    valor,
  }]
}
