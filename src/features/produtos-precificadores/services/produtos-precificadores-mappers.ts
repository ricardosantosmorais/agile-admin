import { asArray, asBoolean, asString } from '@/src/lib/api-payload'
import { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'
import { toLookupOption } from '@/src/lib/lookup-options'
import { formatLocalizedDecimal, parseInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'
import type {
  ProdutoPrecificadorApiRow,
  ProdutoPrecificadorAudienceCriterion,
  ProdutoPrecificadorAudienceType,
  ProdutoPrecificadorConditionsDraft,
  ProdutoPrecificadorCriterionOption,
  ProdutoPrecificadorDefinitionDraft,
  ProdutoPrecificadorGeneralDraft,
  ProdutoPrecificadorProductCriterion,
  ProdutoPrecificadorProductType,
  ProdutoPrecificadorWizardDraft,
  ProdutoPrecificadorWizardPayload,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-types'

const audienceTypeToField: Record<Exclude<ProdutoPrecificadorAudienceType, 'todos'>, keyof ProdutoPrecificadorApiRow> = {
  canal_distribuicao_cliente: 'id_canal_distribuicao_cliente',
  cliente: 'id_cliente',
  contribuinte: 'contribuinte',
  filial: 'id_filial',
  fonte_st: 'fonte_st',
  grupo: 'id_grupo',
  praca: 'id_praca',
  rede: 'id_rede',
  segmento: 'id_segmento',
  supervisor: 'id_supervisor',
  tabela_preco: 'id_tabela_preco',
  tipo_cliente: 'tipo_cliente',
  uf: 'uf',
  vendedor: 'id_vendedor',
}

const productTypeToField: Record<Exclude<ProdutoPrecificadorProductType, 'todos'>, keyof ProdutoPrecificadorApiRow> = {
  canal_distribuicao_produto: 'id_canal_distribuicao_produto',
  colecao: 'id_colecao',
  departamento: 'id_departamento',
  fornecedor: 'id_fornecedor',
  marca: 'id_marca',
  produto: 'id_produto',
  produto_pai: 'id_produto_pai',
  promocao_precificador: 'id_promocao',
}

const simpleAudienceLabels: Partial<Record<Exclude<ProdutoPrecificadorAudienceType, 'todos'>, Record<string, string>>> = {
  contribuinte: { '1': 'Sim', '0': 'Não' },
  fonte_st: { '1': 'Sim', '0': 'Não' },
  tipo_cliente: { PF: 'Pessoa Física', PJ: 'Pessoa Jurídica' },
  uf: {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
    ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
  },
}

export const produtoPrecificadorDefaultDraft: ProdutoPrecificadorWizardDraft = {
  audiences: [{ id: 'aud-1', type: 'todos', values: [] }],
  products: [{ id: 'prd-1', type: 'todos', values: [], packaging: null }],
  definitions: [{
    id: 'def-1',
    ultimo_preco: false,
    preco: '',
    desconto: '',
    acrescimo: '',
    pedido_minimo: '',
    pedido_maximo: '',
    itens_pedido_de: '',
    itens_pedido_ate: '',
  }],
  general: {
    nome: '',
    codigo: '',
    origem: '',
    perfil: 'todos',
    tipo: '',
    posicao: '',
    indice: '',
    promocao: false,
    aplica_automatico: false,
    ativo: true,
    modifica: false,
    fator: false,
    aplica_promocao: false,
    aplica_orcamento: false,
    app: false,
    prioridade: false,
    promocao_ecommerce: false,
    conta_corrente: false,
    credita_desconto: false,
    preco_base: false,
    st: false,
  },
  conditions: {
    data_inicio: '',
    data_fim: '',
    id_forma_pagamento: '',
    id_condicao_pagamento: '',
    id_forma_entrega: '',
    prazo_medio: '',
    forma_pagamento_lookup: null,
    condicao_pagamento_lookup: null,
  },
}

function createId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`
}

function normalizeOption(id: unknown, label: unknown) {
  const normalizedId = asString(id).trim()
  const normalizedLabel = asString(label).trim()
  if (!normalizedId) return null
  return {
    id: normalizedId,
    label: normalizedLabel || normalizedId,
  }
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function relationLabel(record: ProdutoPrecificadorApiRow, relation: keyof ProdutoPrecificadorApiRow, fallback: unknown) {
  const entity = record[relation] as { nome?: unknown; nome_fantasia?: unknown } | null | undefined
  return asString(entity?.nome_fantasia ?? entity?.nome ?? fallback).trim()
}

function collectAudienceCriteria(rows: ProdutoPrecificadorApiRow[]): ProdutoPrecificadorAudienceCriterion[] {
  const criteria: ProdutoPrecificadorAudienceCriterion[] = []

  const hasOnlyTodos = rows.every((row) =>
    Object.values(audienceTypeToField).every((field) => row[field] == null || asString(row[field]).trim() === ''),
  )

  if (hasOnlyTodos) {
    return [{ id: 'aud-1', type: 'todos', values: [] }]
  }

  ;(Object.entries(audienceTypeToField) as Array<[Exclude<ProdutoPrecificadorAudienceType, 'todos'>, keyof ProdutoPrecificadorApiRow]>).forEach(([type, field], index) => {
    const options = new Map<string, ProdutoPrecificadorCriterionOption>()

    rows.forEach((row) => {
      const rawValue = row[field]
      const normalizedId = rawValue == null ? '' : asString(rawValue).trim()
      if (!normalizedId) return

      const option = normalizeOption(
        normalizedId,
        simpleAudienceLabels[type]?.[normalizedId]
          ?? relationLabel(
            row,
            type === 'canal_distribuicao_cliente'
              ? 'canal_distribuicao_cliente'
              : (type as keyof ProdutoPrecificadorApiRow),
            normalizedId,
          ),
      )

      if (option) {
        options.set(option.id, option)
      }
    })

    if (options.size > 0) {
      criteria.push({
        id: createId('aud', index),
        type,
        values: [...options.values()],
      })
    }
  })

  return criteria.length ? criteria : [{ id: 'aud-1', type: 'todos' as const, values: [] }]
}

function collectProductCriteria(rows: ProdutoPrecificadorApiRow[]): ProdutoPrecificadorProductCriterion[] {
  const criteria: ProdutoPrecificadorProductCriterion[] = []

  const hasOnlyTodos = rows.every((row) =>
    Object.values(productTypeToField).every((field) => row[field] == null || asString(row[field]).trim() === ''),
  )

  if (hasOnlyTodos) {
    return [{ id: 'prd-1', type: 'todos', values: [], packaging: null }]
  }

  ;(Object.entries(productTypeToField) as Array<[Exclude<ProdutoPrecificadorProductType, 'todos'>, keyof ProdutoPrecificadorApiRow]>).forEach(([type, field], index) => {
    const options = new Map<string, ProdutoPrecificadorCriterionOption>()
    let packaging: ProdutoPrecificadorCriterionOption | null = null

    rows.forEach((row) => {
      const rawValue = row[field]
      const normalizedId = rawValue == null ? '' : asString(rawValue).trim()
      if (!normalizedId) return

      const relationKey = type === 'promocao_precificador' ? 'promocao_precificador' : (type as keyof ProdutoPrecificadorApiRow)
      const option = normalizeOption(normalizedId, relationLabel(row, relationKey, normalizedId))
      if (option) {
        options.set(option.id, option)
      }

      if (type === 'produto' && row.id_embalagem != null && asString(row.id_embalagem).trim()) {
        packaging = normalizeOption(row.id_embalagem, relationLabel(row, 'embalagem', row.id_embalagem))
      }
    })

    if (options.size > 0) {
      criteria.push({
        id: createId('prd', index),
        type,
        values: [...options.values()],
        packaging,
      })
    }
  })

  return criteria.length ? criteria : [{ id: 'prd-1', type: 'todos' as const, values: [], packaging: null }]
}

function definitionKey(row: ProdutoPrecificadorApiRow) {
  return [
    asBoolean(row.ultimo_preco) ? '1' : '0',
    formatLocalizedDecimal(row.preco, 2),
    formatLocalizedDecimal(row.desconto, 2),
    formatLocalizedDecimal(row.acrescimo, 2),
    formatLocalizedDecimal(row.pedido_minimo, 2),
    formatLocalizedDecimal(row.pedido_maximo, 2),
    asString(row.itens_pedido_de).trim(),
    asString(row.itens_pedido_ate).trim(),
  ].join('|')
}

function collectDefinitions(rows: ProdutoPrecificadorApiRow[]) {
  const definitions = new Map<string, ProdutoPrecificadorDefinitionDraft>()

  rows.forEach((row, index) => {
    const key = definitionKey(row)
    if (definitions.has(key)) {
      return
    }

    definitions.set(key, {
      id: createId('def', index),
      ultimo_preco: asBoolean(row.ultimo_preco),
      preco: formatLocalizedDecimal(row.preco, 2),
      desconto: formatLocalizedDecimal(row.desconto, 2),
      acrescimo: formatLocalizedDecimal(row.acrescimo, 2),
      pedido_minimo: formatLocalizedDecimal(row.pedido_minimo, 2),
      pedido_maximo: formatLocalizedDecimal(row.pedido_maximo, 2),
      itens_pedido_de: stringifyValue(row.itens_pedido_de),
      itens_pedido_ate: stringifyValue(row.itens_pedido_ate),
    })
  })

  return definitions.size ? [...definitions.values()] : produtoPrecificadorDefaultDraft.definitions
}

function mapGeneral(row: ProdutoPrecificadorApiRow): ProdutoPrecificadorGeneralDraft {
  return {
    nome: asString(row.nome).trim(),
    codigo: asString(row.codigo).trim(),
    origem: asString(row.origem).trim(),
    perfil: asString(row.perfil).trim() || 'todos',
    tipo: asString(row.tipo).trim(),
    posicao: stringifyValue(row.posicao),
    indice: stringifyValue(row.indice),
    promocao: asBoolean(row.promocao),
    aplica_automatico: asBoolean(row.aplica_automatico),
    ativo: asBoolean(row.ativo),
    modifica: asBoolean(row.modifica),
    fator: asBoolean(row.fator),
    aplica_promocao: asBoolean(row.aplica_promocao),
    aplica_orcamento: asBoolean(row.aplica_orcamento),
    app: asBoolean(row.app),
    prioridade: asBoolean(row.prioridade),
    promocao_ecommerce: asBoolean(row.promocao_ecommerce),
    conta_corrente: asBoolean(row.conta_corrente),
    credita_desconto: asBoolean(row.credita_desconto),
    preco_base: asBoolean(row.preco_base),
    st: asBoolean(row.st),
  }
}

function mapConditions(row: ProdutoPrecificadorApiRow): ProdutoPrecificadorConditionsDraft {
  return {
    data_inicio: formatApiDateTimeToInput(row.data_inicio),
    data_fim: formatApiDateTimeToInput(row.data_fim),
    id_forma_pagamento: asString(row.id_forma_pagamento).trim(),
    id_condicao_pagamento: asString(row.id_condicao_pagamento).trim(),
    id_forma_entrega: asString(row.id_forma_entrega).trim(),
    prazo_medio: stringifyValue(row.prazo_medio),
    forma_pagamento_lookup: toLookupOption(row.forma_pagamento, ['nome'], row.id_forma_pagamento),
    condicao_pagamento_lookup: toLookupOption(row.condicao_pagamento, ['nome'], row.id_condicao_pagamento),
  }
}

export function buildWizardDraftFromApi(record: ProdutoPrecificadorApiRow) {
  const rows = [record, ...asArray(record.filhos)] as ProdutoPrecificadorApiRow[]
  const parent = rows[0] ?? record
  const draft: ProdutoPrecificadorWizardDraft = {
    audiences: collectAudienceCriteria(rows),
    products: collectProductCriteria(rows),
    definitions: collectDefinitions(rows),
    general: mapGeneral(parent),
    conditions: mapConditions(parent),
  }

  return {
    draft,
    originalRows: rows,
  }
}

function expandAudience(criteria: ProdutoPrecificadorAudienceCriterion) {
  if (criteria.type === 'todos') {
    return [{}]
  }

  const field = audienceTypeToField[criteria.type]
  return criteria.values
    .map((item) => asString(item.id).trim())
    .filter(Boolean)
    .map((id) => ({ [field]: id }))
}

function expandProducts(criteria: ProdutoPrecificadorProductCriterion) {
  if (criteria.type === 'todos') {
    return [{}]
  }

  const field = productTypeToField[criteria.type]
  return criteria.values
    .map((item) => asString(item.id).trim())
    .filter(Boolean)
    .map((id) => ({
      [field]: id,
      ...(criteria.type === 'produto' && criteria.packaging?.id ? { id_embalagem: criteria.packaging.id } : {}),
    }))
}

function expandDefinition(definition: ProdutoPrecificadorDefinitionDraft) {
  return {
    ultimo_preco: definition.ultimo_preco ? 1 : 0,
    preco: parseLocalizedNumber(definition.preco) ?? 0,
    desconto: parseLocalizedNumber(definition.desconto) ?? 0,
    acrescimo: parseLocalizedNumber(definition.acrescimo) ?? 0,
    pedido_minimo: parseLocalizedNumber(definition.pedido_minimo) ?? 0,
    pedido_maximo: parseLocalizedNumber(definition.pedido_maximo) ?? 0,
    itens_pedido_de: parseInteger(definition.itens_pedido_de),
    itens_pedido_ate: parseInteger(definition.itens_pedido_ate),
  }
}

function baseRowFromDraft(draft: ProdutoPrecificadorWizardDraft) {
  return {
    nome: asString(draft.general.nome).trim(),
    codigo: asString(draft.general.codigo).trim() || null,
    origem: asString(draft.general.origem).trim(),
    perfil: asString(draft.general.perfil).trim() || 'todos',
    tipo: asString(draft.general.tipo).trim(),
    posicao: parseInteger(draft.general.posicao),
    indice: parseInteger(draft.general.indice),
    promocao: draft.general.promocao ? 1 : 0,
    aplica_automatico: draft.general.aplica_automatico ? 1 : 0,
    ativo: draft.general.ativo ? 1 : 0,
    modifica: draft.general.modifica ? 1 : 0,
    fator: draft.general.fator ? 1 : 0,
    aplica_promocao: draft.general.aplica_promocao ? 1 : 0,
    aplica_orcamento: draft.general.aplica_orcamento ? 1 : 0,
    app: draft.general.app ? 1 : 0,
    prioridade: draft.general.prioridade ? 1 : 0,
    promocao_ecommerce: draft.general.promocao_ecommerce ? 1 : 0,
    conta_corrente: draft.general.conta_corrente ? 1 : 0,
    credita_desconto: draft.general.credita_desconto ? 1 : 0,
    preco_base: draft.general.preco_base ? 1 : 0,
    st: draft.general.st ? 1 : 0,
    data_inicio: formatInputDateTimeToApi(draft.conditions.data_inicio),
    data_fim: formatInputDateTimeToApi(draft.conditions.data_fim),
    id_forma_pagamento: asString(draft.conditions.forma_pagamento_lookup?.id ?? draft.conditions.id_forma_pagamento).trim() || null,
    id_condicao_pagamento: asString(draft.conditions.condicao_pagamento_lookup?.id ?? draft.conditions.id_condicao_pagamento).trim() || null,
    id_forma_entrega: asString(draft.conditions.id_forma_entrega).trim() || null,
    prazo_medio: parseInteger(draft.conditions.prazo_medio),
  }
}

export function flattenWizardDraft(draft: ProdutoPrecificadorWizardDraft) {
  const audiences = draft.audiences.flatMap(expandAudience).filter((item) => Object.keys(item).length > 0)
  const products = draft.products.flatMap(expandProducts).filter((item) => Object.keys(item).length > 0)
  const definitions = draft.definitions.map(expandDefinition)

  const safeAudiences = audiences.length ? audiences : [{}]
  const safeProducts = products.length ? products : [{}]
  const base = baseRowFromDraft(draft)

  const rows: ProdutoPrecificadorApiRow[] = []
  safeAudiences.forEach((audience) => {
    safeProducts.forEach((product) => {
      definitions.forEach((definition) => {
        rows.push({
          ...base,
          ...audience,
          ...product,
          ...definition,
        })
      })
    })
  })

  return rows
}

export function buildRowIdentity(row: ProdutoPrecificadorApiRow) {
  return [
    ...Object.values(audienceTypeToField).map((field) => `${String(field)}:${asString(row[field]).trim()}`),
    ...Object.values(productTypeToField).map((field) => `${String(field)}:${asString(row[field]).trim()}`),
    `id_embalagem:${asString(row.id_embalagem).trim()}`,
    `ultimo_preco:${asBoolean(row.ultimo_preco) ? '1' : '0'}`,
    `preco:${formatLocalizedDecimal(row.preco, 2)}`,
    `desconto:${formatLocalizedDecimal(row.desconto, 2)}`,
    `acrescimo:${formatLocalizedDecimal(row.acrescimo, 2)}`,
    `pedido_minimo:${formatLocalizedDecimal(row.pedido_minimo, 2)}`,
    `pedido_maximo:${formatLocalizedDecimal(row.pedido_maximo, 2)}`,
    `itens_pedido_de:${asString(row.itens_pedido_de).trim()}`,
    `itens_pedido_ate:${asString(row.itens_pedido_ate).trim()}`,
  ].join('|')
}

function sanitizeApiRow(row: ProdutoPrecificadorApiRow) {
  const next = { ...row }
  delete next.cliente
  delete next.filial
  delete next.grupo
  delete next.canal_distribuicao_cliente
  delete next.rede
  delete next.segmento
  delete next.tabela_preco
  delete next.praca
  delete next.supervisor
  delete next.vendedor
  delete next.produto
  delete next.marca
  delete next.produto_pai
  delete next.fornecedor
  delete next.canal_distribuicao_produto
  delete next.colecao
  delete next.departamento
  delete next.promocao_precificador
  delete next.embalagem
  delete next.forma_pagamento
  delete next.condicao_pagamento
  delete next.forma_entrega
  delete next.filhos
  delete next.created_at
  delete next.updated_at
  delete next.deleted_at
  delete next.id_sync
  delete next.cache_sync
  delete next.pluggto_sync
  return next
}

export function buildWizardPayload(
  draft: ProdutoPrecificadorWizardDraft,
  originalRows: ProdutoPrecificadorApiRow[],
  currentId?: string,
): ProdutoPrecificadorWizardPayload {
  const nextRows = flattenWizardDraft(draft)
  const originalByIdentity = new Map<string, ProdutoPrecificadorApiRow[]>()

  originalRows.forEach((row) => {
    const identity = buildRowIdentity(row)
    const bucket = originalByIdentity.get(identity)
    if (bucket) {
      bucket.push(row)
      return
    }
    originalByIdentity.set(identity, [row])
  })

  const rows = nextRows.map((row, index) => {
    const identity = buildRowIdentity(row)
    const bucket = originalByIdentity.get(identity)
    const original = bucket?.shift()
    const nextRow = sanitizeApiRow({
      ...row,
      ...(original?.id ? { id: original.id } : {}),
    })

    if (bucket && bucket.length === 0) {
      originalByIdentity.delete(identity)
    }

    if (index === 0 && currentId) {
      nextRow.id = currentId
      nextRow.id_pai = null
    }

    return nextRow
  })

  const deleteIds = [...originalByIdentity.values()]
    .flat()
    .map((row) => asString(row.id).trim())
    .filter(Boolean)
    .filter((id) => id !== currentId)

  return {
    ...(currentId ? { id: currentId } : {}),
    rows,
    deleteIds,
  }
}
