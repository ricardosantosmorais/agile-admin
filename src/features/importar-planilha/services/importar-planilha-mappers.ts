import { formatDateTime } from '@/src/lib/date-time'
import type {
  ProcessoArquivoDictionaryField,
  ProcessoArquivoDictionaryTable,
  ImportarPlanilhaResponse,
  ProcessoArquivoMappingDetail,
  ProcessoArquivoMappingRecord,
  ProcessoArquivoDetail,
  ProcessoArquivoLogRecord,
  ProcessoArquivoRecord,
  ProcessoArquivoSpreadsheetColumn,
  ProcessoArquivoSpreadsheetPreview,
} from '@/src/features/importar-planilha/services/importar-planilha-types'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return String(value ?? '').trim()
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'rascunho') return { label: 'Rascunho', tone: 'neutral' as const }
  if (normalized === 'criado') return { label: 'Criado', tone: 'success' as const }
  if (normalized === 'iniciado') return { label: 'Iniciado', tone: 'info' as const }
  if (normalized === 'cancelado') return { label: 'Cancelado', tone: 'warning' as const }
  if (normalized === 'finalizado' || normalized === 'sucesso') return { label: normalized === 'sucesso' ? 'Sucesso' : 'Finalizado', tone: 'neutral' as const }
  if (normalized === 'erro') return { label: 'Erro', tone: 'danger' as const }
  return { label: status || '-', tone: 'neutral' as const }
}

function normalizeLogType(tipo: string) {
  const normalized = tipo.toLowerCase()
  if (normalized === 'informacao') return { label: 'Informação', tone: 'success' as const }
  if (normalized === 'atencao') return { label: 'Atenção', tone: 'warning' as const }
  if (normalized === 'erro') return { label: 'Erro', tone: 'danger' as const }
  return { label: tipo || '-', tone: 'neutral' as const }
}

export function normalizeProcessoArquivoRecord(value: unknown): ProcessoArquivoRecord {
  const record = asRecord(value)
  const status = asString(record.status)
  const normalizedStatus = normalizeStatus(status)

  return {
    id: asString(record.id),
    usuarioNome: asString(asRecord(record.usuario).nome) || '-',
    createdAt: formatDateTime(asString(record.created_at)),
    status,
    statusLabel: normalizedStatus.label,
    statusTone: normalizedStatus.tone,
    arquivo: asString(record.arquivo),
    canStart: status === 'rascunho',
    canCancel: status === 'criado' || status === 'rascunho',
    canReprocess: status === 'erro',
    canReplaceFile: status === 'criado' || status === 'rascunho' || status === 'erro',
  }
}

function normalizeProcessoArquivoLog(value: unknown): ProcessoArquivoLogRecord {
  const record = asRecord(value)
  const tipo = asString(record.tipo)
  const normalizedType = normalizeLogType(tipo)

  return {
    id: asString(record.id),
    tipo,
    tipoLabel: normalizedType.label,
    tipoTone: normalizedType.tone,
    createdAt: formatDateTime(asString(record.created_at)),
    mensagem: asString(record.mensagem) || '-',
  }
}

export function normalizeProcessoArquivoDetail(value: unknown): ProcessoArquivoDetail {
  const record = asRecord(value)
  const status = asString(record.status)
  const normalizedStatus = normalizeStatus(status)

  return {
    id: asString(record.id),
    usuarioNome: asString(asRecord(record.usuario).nome) || '-',
    codigo: asString(record.codigo),
    arquivo: asString(record.arquivo),
    status,
    statusLabel: normalizedStatus.label,
    statusTone: normalizedStatus.tone,
    processado: asBoolean(record.processado),
    dataProcessado: formatDateTime(asString(record.data_processado)),
    logs: asArray(record.logs).map(normalizeProcessoArquivoLog),
  }
}

export function normalizeImportarPlanilhaResponse(payload: unknown, fallback: { page: number; perPage: number }): ImportarPlanilhaResponse {
  const record = asRecord(payload)
  const data = asArray(record.data).map(normalizeProcessoArquivoRecord)
  const meta = asRecord(record.meta)

  const total = asNumber(meta.total, data.length)
  const page = asNumber(meta.current_page ?? meta.page, fallback.page)
  const perPage = asNumber(meta.per_page ?? meta.perPage ?? meta.perpage, fallback.perPage)
  const from = data.length ? asNumber(meta.from, (page - 1) * perPage + 1) : 0
  const to = data.length ? asNumber(meta.to, from + data.length - 1) : 0
  const pages = Math.max(1, asNumber(meta.last_page ?? meta.pages, Math.ceil(total / Math.max(1, perPage))))

  return {
    data,
    meta: {
      total,
      from,
      to,
      page,
      pages,
      perPage,
    },
  }
}

function normalizeSpreadsheetColumn(value: unknown, index: number): ProcessoArquivoSpreadsheetColumn {
  const record = asRecord(value)
  const letter = asString(record.letter) || String.fromCharCode(65 + index)
  return {
    letter,
    name: asString(record.name) || `Coluna ${letter}`,
  }
}

function normalizeSpreadsheetPreview(value: unknown): ProcessoArquivoSpreadsheetPreview {
  const record = asRecord(value)
  const columns = asArray(record.columns).map(normalizeSpreadsheetColumn)

  return {
    sheetName: asString(record.sheetName),
    columns,
    rows: asArray(record.rows).map((row) => asArray(row).map(asString)),
    previewRows: asNumber(record.previewRows, 0),
    warning: asString(record.warning),
  }
}

function normalizeDictionaryField(value: unknown): ProcessoArquivoDictionaryField {
  const record = asRecord(value)
  const nullableRaw = asString(record.nulo).toUpperCase()
  const nullable = nullableRaw !== 'NO'

  return {
    id: asString(record.id),
    name: asString(record.nome) || '-',
    type: asString(record.tipo) || '-',
    nullable,
    required: !nullable,
    position: asNumber(record.posicao, 0),
  }
}

function shouldIncludeDictionaryField(value: unknown) {
  const record = asRecord(value)
  if (!Object.prototype.hasOwnProperty.call(record, 'integra_planilha')) return true
  return asBoolean(record.integra_planilha)
}

function normalizeDictionaryTable(value: unknown): ProcessoArquivoDictionaryTable {
  const record = asRecord(value)
  const fields = asArray(record.campos)
    .filter(shouldIncludeDictionaryField)
    .map(normalizeDictionaryField)
    .filter((field) => field.id)
    .sort((left, right) => left.position - right.position)

  return {
    id: asString(record.id),
    name: asString(record.nome) || '-',
    fields,
  }
}

function normalizeMapping(value: unknown): ProcessoArquivoMappingRecord {
  const record = asRecord(value)

  return {
    id: asString(record.id),
    tableId: asString(record.id_tabela ?? record.tabela),
    sourceColumn: asString(record.coluna_origem),
    targetFieldId: asString(record.id_campo ?? record.coluna_destino),
  }
}

export function normalizeProcessoArquivoMappingDetail(payload: unknown): ProcessoArquivoMappingDetail {
  const record = asRecord(payload)

  return {
    processo: normalizeProcessoArquivoDetail(record.processo),
    tables: asArray(record.dicionarios).map(normalizeDictionaryTable).filter((table) => table.id),
    mappings: asArray(record.mapeamentos).map(normalizeMapping).filter((mapping) => mapping.sourceColumn && mapping.targetFieldId),
    preview: normalizeSpreadsheetPreview(record.preview),
  }
}
