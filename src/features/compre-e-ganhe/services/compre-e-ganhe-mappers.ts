import type { CrudRecord } from '@/src/components/crud-base/types'
import { formatApiDateToInput, formatInputDateToApiEnd, formatInputDateToApiStart } from '@/src/lib/date-input'
import { parseCurrencyInput } from '@/src/lib/input-masks'
import { parseInteger } from '@/src/lib/value-parsers'

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function normalizeCompreEGanheRecord(record: CrudRecord): CrudRecord {
  const grupo = (record.grupo && typeof record.grupo === 'object' ? record.grupo : null) as { id?: unknown; nome?: unknown } | null
  const grupoId = record.id_grupo_promocao === null || record.id_grupo_promocao === undefined
    ? grupo?.id === null || grupo?.id === undefined ? '' : String(grupo.id).trim()
    : String(record.id_grupo_promocao).trim()
  const grupoLabel = normalizeString(grupo?.nome)

  return {
    ...record,
    ativo: normalizeBoolean(record.ativo),
    gera_pedido: normalizeBoolean(record.gera_pedido),
    codigo: normalizeString(record.codigo),
    nome: normalizeString(record.nome),
    descricao: typeof record.descricao === 'string' ? record.descricao : '',
    perfil: normalizeString(record.perfil),
    id_grupo_promocao: grupoId,
    id_grupo_promocao_lookup: grupoId ? { id: grupoId, label: grupoLabel || grupoId } : null,
    maximo_brindes: record.maximo_brindes === null || record.maximo_brindes === undefined ? '' : String(record.maximo_brindes),
    quantidade_maxima_cliente: record.quantidade_maxima_cliente === null || record.quantidade_maxima_cliente === undefined ? '' : String(record.quantidade_maxima_cliente),
    data_inicio: formatApiDateToInput(record.data_inicio),
    data_fim: formatApiDateToInput(record.data_fim),
    imagem: normalizeString(record.imagem),
    imagem_mobile: normalizeString(record.imagem_mobile),
  }
}

export function toCompreEGanhePayload(record: CrudRecord): CrudRecord {
  const nome = normalizeString(record.nome)
  const perfil = normalizeString(record.perfil)
  const dataInicio = formatInputDateToApiStart(record.data_inicio)
  const dataFim = formatInputDateToApiEnd(record.data_fim)

  if (!nome) {
    throw new Error('Informe o nome da campanha.')
  }
  if (!perfil) {
    throw new Error('Selecione o perfil.')
  }
  if (!dataInicio || !dataFim) {
    throw new Error('Informe a data inicial e final.')
  }
  if (String(record.data_inicio || '') > String(record.data_fim || '')) {
    throw new Error('A data fim deve ser maior ou igual à data início.')
  }

  return {
    id: normalizeString(record.id) || undefined,
    codigo: normalizeString(record.codigo) || null,
    nome,
    descricao: typeof record.descricao === 'string' ? record.descricao : '',
    id_grupo_promocao: normalizeString(record.id_grupo_promocao) || null,
    perfil,
    maximo_brindes: parseInteger(record.maximo_brindes),
    quantidade_maxima_cliente: parseInteger(record.quantidade_maxima_cliente),
    data_inicio: dataInicio,
    data_fim: dataFim,
    imagem: normalizeString(record.imagem) || null,
    imagem_mobile: normalizeString(record.imagem_mobile) || null,
    gera_pedido: normalizeBoolean(record.gera_pedido),
    ativo: normalizeBoolean(record.ativo),
  }
}

export function toBrindeRegraPayload(brindeId: string, record: CrudRecord) {
  const tipoRegra = normalizeString(record.tipo_regra)
  const tipo = normalizeString(record.tipo)
  if (!tipoRegra) {
    throw new Error('Selecione o tipo da regra.')
  }
  if (!tipo) {
    throw new Error('Selecione o tipo da condição.')
  }

  const payload: CrudRecord = {
    id: normalizeString(record.id) || undefined,
    id_brinde: brindeId,
    id_sync: 9999,
    id_regra: normalizeString(record.id_regra) || null,
    tipo_regra: tipoRegra,
    tipo,
    pedido_minimo: parseCurrencyInput(normalizeString(record.pedido_minimo)) ?? 0,
    pedido_maximo: parseCurrencyInput(normalizeString(record.pedido_maximo)) ?? 0,
    id_produto_pai: null,
    id_produto: null,
    id_departamento: null,
    id_fornecedor: null,
    id_colecao: null,
    id_embalagem: normalizeString(record.id_embalagem) || null,
  }

  if (tipoRegra === 'produto_pai') payload.id_produto_pai = normalizeString(record.id_produto_pai) || null
  if (tipoRegra === 'produto') payload.id_produto = normalizeString(record.id_produto) || null
  if (tipoRegra === 'departamento') payload.id_departamento = normalizeString(record.id_departamento) || null
  if (tipoRegra === 'fornecedor') payload.id_fornecedor = normalizeString(record.id_fornecedor) || null
  if (tipoRegra === 'colecao') payload.id_colecao = normalizeString(record.id_colecao) || null

  if (!payload.id_produto_pai && !payload.id_produto && !payload.id_departamento && !payload.id_fornecedor && !payload.id_colecao) {
    throw new Error('Selecione o alvo da regra.')
  }

  return payload
}

export function toBrindeProdutoPayload(brindeId: string, record: CrudRecord) {
  const idProduto = normalizeString(record.id_produto)
  if (!idProduto) {
    throw new Error('Selecione o produto.')
  }

  const quantidade = parseInteger(record.quantidade)
  if (quantidade === null || quantidade < 0) {
    throw new Error('Informe a quantidade.')
  }

  return {
    id: normalizeString(record.id) || undefined,
    id_brinde: brindeId,
    id_sync: 9999,
    id_produto: idProduto,
    id_embalagem: normalizeString(record.id_embalagem) || null,
    id_regra: normalizeString(record.id_regra) || null,
    quantidade,
    quantidade_maxima: parseInteger(record.quantidade_maxima),
  }
}

export function toBrindeUniversoPayload(brindeId: string, record: CrudRecord) {
  const universo = normalizeString(record.universo)
  if (!universo) {
    throw new Error('Selecione o universo.')
  }

  let idObjeto = normalizeString(record.id_objeto)
  if (universo === 'todos') {
    idObjeto = ''
  }
  if (universo !== 'todos' && !idObjeto) {
    throw new Error('Selecione o valor do universo.')
  }

  return {
    id: normalizeString(record.id) || undefined,
    id_brinde: brindeId,
    id_regra: normalizeString(record.id_regra) || null,
    universo,
    id_objeto: idObjeto,
    ativo: normalizeBoolean(record.ativo),
  }
}
