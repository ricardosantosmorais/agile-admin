import { asArray, asBoolean, asString } from '@/src/lib/api-payload'
import { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'
import { toLookupOption } from '@/src/lib/lookup-options'
import type {
  ExcecaoProdutoApiRow,
  ExcecaoProdutoAudienceCriterion,
  ExcecaoProdutoAudienceType,
  ExcecaoProdutoConditionsDraft,
  ExcecaoProdutoCriterionOption,
  ExcecaoProdutoProductCriterion,
  ExcecaoProdutoProductType,
  ExcecaoProdutoWeekdayConfig,
  ExcecaoProdutoWizardDraft,
  ExcecaoProdutoWizardPayload,
} from '@/src/features/excecoes-produtos/services/excecoes-produtos-types'

const audienceTypeToField: Record<Exclude<ExcecaoProdutoAudienceType, 'todos'>, keyof ExcecaoProdutoApiRow> = {
  canal_distribuicao_cliente: 'id_canal_distribuicao_cliente',
  cliente: 'id_cliente',
  contribuinte: 'contribuinte',
  filial: 'id_filial',
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

const productTypeToField: Record<Exclude<ExcecaoProdutoProductType, 'todos'>, keyof ExcecaoProdutoApiRow> = {
  canal_distribuicao_produto: 'id_canal_distribuicao_produto',
  colecao: 'id_colecao',
  departamento: 'id_departamento',
  fornecedor: 'id_fornecedor',
  marca: 'id_marca',
  produto: 'id_produto',
  produto_pai: 'id_produto_pai',
  promocao: 'id_promocao',
}

const simpleAudienceLabels: Partial<Record<Exclude<ExcecaoProdutoAudienceType, 'todos'>, Record<string, string>>> = {
  contribuinte: { '1': 'Sim', '0': 'Não' },
  tipo_cliente: { PF: 'Pessoa Física', PJ: 'Pessoa Jurídica' },
  uf: {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
    ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
  },
}

const WEEKDAY_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const

const DEFAULT_WEEKDAY_FROM = '00:00'
const DEFAULT_WEEKDAY_TO = '23:59'

function createDefaultWeekdayConfig(): ExcecaoProdutoWeekdayConfig {
  return {
    active: true,
    from: DEFAULT_WEEKDAY_FROM,
    to: DEFAULT_WEEKDAY_TO,
  }
}

export const excecaoProdutoDefaultDraft: ExcecaoProdutoWizardDraft = {
  audiences: [{ id: 'aud-1', type: 'todos', values: [] }],
  products: [{ id: 'prd-1', type: 'todos', values: [] }],
  general: {
    ativo: true,
    orcamento: false,
    motivo: '',
    metadata: '',
  },
  conditions: {
    data_inicio: '',
    data_fim: '',
    id_forma_pagamento: '',
    id_condicao_pagamento: '',
    tipo_entrega: '',
    forma_pagamento_lookup: null,
    condicao_pagamento_lookup: null,
    seg: createDefaultWeekdayConfig(),
    ter: createDefaultWeekdayConfig(),
    qua: createDefaultWeekdayConfig(),
    qui: createDefaultWeekdayConfig(),
    sex: createDefaultWeekdayConfig(),
    sab: createDefaultWeekdayConfig(),
    dom: createDefaultWeekdayConfig(),
  },
}

function createId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`
}

function normalizeOption(id: unknown, label: unknown) {
  const normalizedId = asString(id).trim()
  const normalizedLabel = asString(label).trim()
  if (!normalizedId) return null
  return { id: normalizedId, label: normalizedLabel || normalizedId }
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const normalized = asString(value).trim()
    if (normalized) return normalized
  }
  return ''
}

function relationLabel(record: ExcecaoProdutoApiRow, relation: keyof ExcecaoProdutoApiRow, fallback: unknown) {
  const entity = record[relation] as { nome?: unknown; nome_fantasia?: unknown; razao_social?: unknown } | null | undefined
  return firstNonEmpty(entity?.nome_fantasia, entity?.razao_social, entity?.nome, fallback)
}

function collectAudienceCriteria(rows: ExcecaoProdutoApiRow[]): ExcecaoProdutoAudienceCriterion[] {
  const criteria: ExcecaoProdutoAudienceCriterion[] = []
  const hasOnlyTodos = rows.every((row) => Object.values(audienceTypeToField).every((field) => row[field] == null || asString(row[field]).trim() === ''))
  if (hasOnlyTodos) return [{ id: 'aud-1', type: 'todos', values: [] }]

  ;(Object.entries(audienceTypeToField) as Array<[Exclude<ExcecaoProdutoAudienceType, 'todos'>, keyof ExcecaoProdutoApiRow]>).forEach(([type, field], index) => {
    const options = new Map<string, ExcecaoProdutoCriterionOption>()
    rows.forEach((row) => {
      const normalizedId = row[field] == null ? '' : asString(row[field]).trim()
      if (!normalizedId) return
      const relationKey = type === 'canal_distribuicao_cliente' ? 'canal_distribuicao_cliente' : (type as keyof ExcecaoProdutoApiRow)
      const option = normalizeOption(normalizedId, simpleAudienceLabels[type]?.[normalizedId] ?? relationLabel(row, relationKey, normalizedId))
      if (option) options.set(option.id, option)
    })
    if (options.size) criteria.push({ id: createId('aud', index), type, values: [...options.values()] })
  })

  return criteria.length ? criteria : [{ id: 'aud-1', type: 'todos', values: [] }]
}

function collectProductCriteria(rows: ExcecaoProdutoApiRow[]): ExcecaoProdutoProductCriterion[] {
  const criteria: ExcecaoProdutoProductCriterion[] = []
  const hasOnlyTodos = rows.every((row) => Object.values(productTypeToField).every((field) => row[field] == null || asString(row[field]).trim() === ''))
  if (hasOnlyTodos) return [{ id: 'prd-1', type: 'todos', values: [] }]

  ;(Object.entries(productTypeToField) as Array<[Exclude<ExcecaoProdutoProductType, 'todos'>, keyof ExcecaoProdutoApiRow]>).forEach(([type, field], index) => {
    const options = new Map<string, ExcecaoProdutoCriterionOption>()
    rows.forEach((row) => {
      const normalizedId = row[field] == null ? '' : asString(row[field]).trim()
      if (!normalizedId) return
      const relationKey = type === 'promocao' ? 'promocao' : (type as keyof ExcecaoProdutoApiRow)
      const option = normalizeOption(normalizedId, relationLabel(row, relationKey, normalizedId))
      if (option) options.set(option.id, option)
    })
    if (options.size) criteria.push({ id: createId('prd', index), type, values: [...options.values()] })
  })

  return criteria.length ? criteria : [{ id: 'prd-1', type: 'todos', values: [] }]
}

function mapWeekday(record: ExcecaoProdutoApiRow, key: typeof WEEKDAY_KEYS[number]): ExcecaoProdutoWeekdayConfig {
  const active = record[key] == null ? true : asBoolean(record[key])
  const from = asString(record[`${key}_horario_de`]).trim().slice(0, 5)
  const to = asString(record[`${key}_horario_ate`]).trim().slice(0, 5)
  return {
    active,
    from: active ? (from || DEFAULT_WEEKDAY_FROM) : from,
    to: active ? (to || DEFAULT_WEEKDAY_TO) : to,
  }
}

function mapConditions(row: ExcecaoProdutoApiRow): ExcecaoProdutoConditionsDraft {
  return {
    data_inicio: formatApiDateTimeToInput(row.data_inicio),
    data_fim: formatApiDateTimeToInput(row.data_fim),
    id_forma_pagamento: asString(row.id_forma_pagamento).trim(),
    id_condicao_pagamento: asString(row.id_condicao_pagamento).trim(),
    tipo_entrega: asString(row.tipo_entrega).trim(),
    forma_pagamento_lookup: toLookupOption(row.forma_pagamento, ['nome'], row.id_forma_pagamento),
    condicao_pagamento_lookup: toLookupOption(row.condicao_pagamento, ['nome'], row.id_condicao_pagamento),
    seg: mapWeekday(row, 'seg'),
    ter: mapWeekday(row, 'ter'),
    qua: mapWeekday(row, 'qua'),
    qui: mapWeekday(row, 'qui'),
    sex: mapWeekday(row, 'sex'),
    sab: mapWeekday(row, 'sab'),
    dom: mapWeekday(row, 'dom'),
  }
}

export function buildWizardDraftFromApi(record: ExcecaoProdutoApiRow) {
  const rows = [record, ...asArray(record.filhos)] as ExcecaoProdutoApiRow[]
  const parent = rows[0] ?? record
  return {
    draft: {
      audiences: collectAudienceCriteria(rows),
      products: collectProductCriteria(rows),
      general: {
        ativo: asBoolean(parent.ativo),
        orcamento: asBoolean(parent.orcamento),
        motivo: asString(parent.motivo).trim(),
        metadata: asString(parent.metadata).trim(),
      },
      conditions: mapConditions(parent),
    },
    originalRows: rows,
  }
}

function expandAudience(criteria: ExcecaoProdutoAudienceCriterion) {
  if (criteria.type === 'todos') return [{}]
  const field = audienceTypeToField[criteria.type]
  return criteria.values.map((item) => asString(item.id).trim()).filter(Boolean).map((id) => ({ [field]: id }))
}

function expandProducts(criteria: ExcecaoProdutoProductCriterion) {
  if (criteria.type === 'todos') return [{}]
  const field = productTypeToField[criteria.type]
  return criteria.values.map((item) => asString(item.id).trim()).filter(Boolean).map((id) => ({ [field]: id }))
}

function baseRowFromDraft(draft: ExcecaoProdutoWizardDraft) {
  const next: ExcecaoProdutoApiRow = {
    ativo: draft.general.ativo ? 1 : 0,
    orcamento: draft.general.orcamento ? 1 : 0,
    motivo: asString(draft.general.motivo).trim(),
    metadata: asString(draft.general.metadata).trim() || null,
    data_inicio: formatInputDateTimeToApi(draft.conditions.data_inicio),
    data_fim: formatInputDateTimeToApi(draft.conditions.data_fim),
    id_forma_pagamento: asString(draft.conditions.forma_pagamento_lookup?.id ?? draft.conditions.id_forma_pagamento).trim() || null,
    id_condicao_pagamento: asString(draft.conditions.condicao_pagamento_lookup?.id ?? draft.conditions.id_condicao_pagamento).trim() || null,
    tipo_entrega: asString(draft.conditions.tipo_entrega).trim() || null,
  }

  WEEKDAY_KEYS.forEach((key) => {
    next[key] = draft.conditions[key].active ? 1 : 0
    next[`${key}_horario_de`] = draft.conditions[key].active ? `${(draft.conditions[key].from || DEFAULT_WEEKDAY_FROM)}:00` : null
    next[`${key}_horario_ate`] = draft.conditions[key].active ? `${(draft.conditions[key].to || DEFAULT_WEEKDAY_TO)}:00` : null
  })

  return next
}

export function flattenWizardDraft(draft: ExcecaoProdutoWizardDraft) {
  const audiences = draft.audiences.flatMap(expandAudience).filter((item) => Object.keys(item).length > 0)
  const products = draft.products.flatMap(expandProducts).filter((item) => Object.keys(item).length > 0)
  const safeAudiences = audiences.length ? audiences : [{}]
  const safeProducts = products.length ? products : [{}]
  const base = baseRowFromDraft(draft)

  const rows: ExcecaoProdutoApiRow[] = []
  safeAudiences.forEach((audience) => {
    safeProducts.forEach((product) => {
      rows.push({ ...base, ...audience, ...product })
    })
  })

  return rows
}

export function buildRowIdentity(row: ExcecaoProdutoApiRow) {
  return [
    ...Object.values(audienceTypeToField).map((field) => `${String(field)}:${asString(row[field]).trim()}`),
    ...Object.values(productTypeToField).map((field) => `${String(field)}:${asString(row[field]).trim()}`),
  ].join('|')
}

function sanitizeApiRow(row: ExcecaoProdutoApiRow) {
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
  delete next.promocao
  delete next.forma_pagamento
  delete next.condicao_pagamento
  delete next.filhos
  return next
}

export function buildWizardPayload(
  draft: ExcecaoProdutoWizardDraft,
  originalRows: ExcecaoProdutoApiRow[],
  currentId?: string,
): ExcecaoProdutoWizardPayload {
  const nextRows = flattenWizardDraft(draft)
  const originalByIdentity = new Map<string, ExcecaoProdutoApiRow[]>()
  const normalizedCurrentId = asString(currentId).trim()

  originalRows.forEach((row) => {
    if (normalizedCurrentId && asString(row.id).trim() === normalizedCurrentId) return
    const identity = buildRowIdentity(row)
    const bucket = originalByIdentity.get(identity)
    if (bucket) bucket.push(row)
    else originalByIdentity.set(identity, [row])
  })

  const rows = nextRows.map((row, index) => {
    const identity = buildRowIdentity(row)
    const bucket = index === 0 && normalizedCurrentId ? undefined : originalByIdentity.get(identity)
    const original = bucket?.shift()
    const nextRow = sanitizeApiRow({ ...row, ...(original?.id ? { id: original.id } : {}) })
    if (bucket && bucket.length === 0) originalByIdentity.delete(identity)
    if (index === 0 && normalizedCurrentId) {
      nextRow.id = normalizedCurrentId
      nextRow.id_pai = null
    }
    return nextRow
  })

  const deleteIds = [...originalByIdentity.values()]
    .flat()
    .map((row) => asString(row.id).trim())
    .filter(Boolean)
    .filter((id) => id !== normalizedCurrentId)

  return {
    ...(normalizedCurrentId ? { id: normalizedCurrentId } : {}),
    rows,
    deleteIds,
  }
}
