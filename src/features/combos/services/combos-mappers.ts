import type { CrudRecord } from '@/src/components/crud-base/types'
import { formatApiDateToInput, formatInputDateToApiEnd, formatInputDateToApiStart } from '@/src/lib/date-input'
import { formatLocalizedDecimal, parseInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'

export { formatApiDateToInput }

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function parseMoneyValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

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

export function getComboTypeLabel(type: unknown) {
  switch (normalizeString(type)) {
    case 'faixa_quantidade':
      return 'Faixa de quantidade'
    case 'quantidade_minima':
      return 'Quantidade mínima'
    default:
      return '-'
  }
}

export function normalizeComboRecord(record: CrudRecord): CrudRecord {
  const grupo = (record.grupo && typeof record.grupo === 'object' ? record.grupo : null) as { id?: unknown; nome?: unknown } | null
  const grupoId = normalizeString(record.id_grupo_promocao || grupo?.id)
  const grupoLabel = normalizeString(grupo?.nome)

  return {
    ...record,
    ativo: normalizeBoolean(record.ativo),
    aceita_parcial: normalizeBoolean(record.aceita_parcial),
    codigo: normalizeString(record.codigo),
    nome: normalizeString(record.nome),
    tipo: normalizeString(record.tipo),
    origem_preco: normalizeString(record.origem_preco),
    id_grupo_promocao: grupoId,
    id_grupo_promocao_lookup: grupoId ? { id: grupoId, label: grupoLabel || grupoId } : null,
    data_inicio: formatApiDateToInput(record.data_inicio),
    data_fim: formatApiDateToInput(record.data_fim),
    itens_distintos: record.itens_distintos === null || record.itens_distintos === undefined ? '0' : String(record.itens_distintos),
    imagem: normalizeString(record.imagem),
    imagem_mobile: normalizeString(record.imagem_mobile),
    descricao: typeof record.descricao === 'string' ? record.descricao : '',
  }
}

export function toComboPayload(record: CrudRecord): CrudRecord {
  const nome = normalizeString(record.nome)
  const tipo = normalizeString(record.tipo)
  const origemPreco = normalizeString(record.origem_preco)
  const dataInicio = formatInputDateToApiStart(record.data_inicio)
  const dataFim = formatInputDateToApiEnd(record.data_fim)

  if (!nome) {
    throw new Error('Informe o nome do combo.')
  }

  if (!tipo) {
    throw new Error('Selecione o tipo do combo.')
  }

  if (!origemPreco) {
    throw new Error('Selecione a origem de preço.')
  }

  if (!dataInicio || !dataFim) {
    throw new Error('Informe o período do combo.')
  }

  if (String(record.data_inicio || '') > String(record.data_fim || '')) {
    throw new Error('A data fim deve ser maior ou igual à data início.')
  }

  return {
    id: normalizeString(record.id) || undefined,
    id_empresa: normalizeString(record.id_empresa) || undefined,
    id_filial: normalizeString(record.id_filial) || null,
    ativo: normalizeBoolean(record.ativo),
    aceita_parcial: normalizeBoolean(record.aceita_parcial),
    codigo: normalizeString(record.codigo) || null,
    nome,
    tipo,
    origem_preco: origemPreco,
    id_grupo_promocao: normalizeString(record.id_grupo_promocao) || null,
    data_inicio: dataInicio,
    data_fim: dataFim,
    itens_distintos: parseInteger(record.itens_distintos) ?? 0,
    imagem: normalizeString(record.imagem) || null,
    imagem_mobile: normalizeString(record.imagem_mobile) || null,
    descricao: typeof record.descricao === 'string' ? record.descricao : '',
  }
}

export function toComboProdutoPayload(comboId: string, record: CrudRecord) {
  const tipo = normalizeString(record.tipo)

  return {
    id_promocao: comboId,
    tipo,
    altera_quantidade: normalizeBoolean(record.altera_quantidade),
    id_produto_pai: tipo === 'produto_pai' ? normalizeString(record.id_produto_pai) || null : null,
    id_produto: tipo === 'produto' ? normalizeString(record.id_produto) || null : null,
    id_embalagem: tipo === 'produto' ? normalizeString(record.id_embalagem) || null : null,
    id_departamento: tipo === 'departamento' ? normalizeString(record.id_departamento) || null : null,
    id_fornecedor: tipo === 'fornecedor' ? normalizeString(record.id_fornecedor) || null : null,
    id_colecao: tipo === 'colecao' ? normalizeString(record.id_colecao) || null : null,
    id_marca: tipo === 'marca' ? normalizeString(record.id_marca) || null : null,
    preco: parseMoneyValue(record.preco),
    desconto: parseMoneyValue(record.desconto),
    pedido_minimo: parseInteger(record.pedido_minimo),
    pedido_maximo: parseInteger(record.pedido_maximo),
  }
}

export function formatComboProdutoPrice(value: unknown) {
  const parsed = parseMoneyValue(value)
  return parsed === null ? '-' : `R$ ${formatMoneyInput(parsed)}`
}

export function formatComboProdutoDiscount(value: unknown) {
  const parsed = parseMoneyValue(value)
  return parsed === null ? '-' : `${formatMoneyInput(parsed)}%`
}

export function formatExceptionDateRangeLabel(start: unknown, end: unknown) {
  const startDate = formatApiDateToInput(start)
  const endDate = formatApiDateToInput(end)

  if (!startDate && !endDate) {
    return '-'
  }

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`
  }

  return startDate || endDate || '-'
}

export function toComboExcecaoPayload(comboId: string, record: CrudRecord) {
  const universo = normalizeString(record.universo)
  const lookupValue = normalizeString(record.id_objeto_universo)
  const contribuinte = normalizeString(record.contribuinte)
  const tipoCliente = normalizeString(record.tipo_cliente)
  const uf = normalizeString(record.uf).toUpperCase()

  let idObjetoUniverso = lookupValue

  if (universo === 'contribuinte') {
    if (contribuinte === '') {
      throw new Error('Selecione o valor da exceção.')
    }
    idObjetoUniverso = contribuinte
  } else if (universo === 'tipo_cliente') {
    if (!tipoCliente) {
      throw new Error('Selecione o valor da exceção.')
    }
    idObjetoUniverso = tipoCliente
  } else if (universo === 'uf') {
    if (!uf) {
      throw new Error('Selecione o valor da exceção.')
    }
    idObjetoUniverso = uf
  } else if (universo === 'todos') {
    idObjetoUniverso = ''
  } else if (!lookupValue) {
    throw new Error('Selecione o valor da exceção.')
  }

  const startDate = formatInputDateToApiStart(record.data_inicio)
  const endDate = formatInputDateToApiEnd(record.data_fim)

  if (record.data_inicio && record.data_fim && String(record.data_inicio) > String(record.data_fim)) {
    throw new Error('A data fim deve ser maior ou igual à data início.')
  }

  return {
    id_promocao: comboId,
    universo,
    id_objeto_universo: idObjetoUniverso,
    id_filial: normalizeString(record.id_filial) || null,
    id_praca: normalizeString(record.id_praca) || null,
    data_inicio: startDate,
    data_fim: endDate,
    ativo: true,
  }
}
