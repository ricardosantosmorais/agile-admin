import { formatDateTime } from '@/src/lib/date-time'
import { formatCurrency } from '@/src/lib/formatters'
import { parseInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'
import type {
  RelatorioDetail,
  RelatorioFiltroDinamico,
  RelatorioListRecord,
  RelatorioListResponse,
  RelatorioProcessoCampo,
  RelatorioProcessoLogRecord,
  RelatorioProcessoLogsResponse,
  RelatorioProcessoRecord,
  RelatorioProcessosResponse,
} from '@/src/features/relatorios/services/relatorios-types'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

function stripLegacyIconMarkup(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toNumberValue(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function formatLegacyDate(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) return '-'
  const source = normalized.includes('T') ? normalized : normalized.replace(' ', 'T')
  const parsed = new Date(source)
  return Number.isNaN(parsed.getTime()) ? normalized : parsed.toLocaleDateString('pt-BR')
}

function normalizeRangeValue(tipo: string, value: string) {
  if (!value) return '-'

  if (tipo === 'data' || tipo === 'data_hora') {
    return formatLegacyDate(value)
  }

  if (tipo === 'valor') {
    const numeric = parseLocalizedNumber(value) ?? Number(value)
    return Number.isFinite(numeric) ? formatCurrency(numeric) : value
  }

  return value
}

function summarizeCampos(campos: RelatorioProcessoCampo[]) {
  if (!campos.length) {
    return 'Nenhum filtro aplicado'
  }

  const grouped = new Map<string, RelatorioProcessoCampo[]>()
  for (const campo of campos) {
    const key = campo.titulo || campo.campo
    const current = grouped.get(key) ?? []
    current.push(campo)
    grouped.set(key, current)
  }

  return Array.from(grouped.entries()).map(([titulo, values]) => {
    if (values.length > 1) {
      return `${titulo}: entre ${normalizeRangeValue(values[0].tipo, values[0].valor)} e ${normalizeRangeValue(values[1].tipo, values[1].valor)}`
    }

    const [first] = values
    const prefix = first.operador === 'ge'
      ? 'a partir de '
      : first.operador === 'le'
        ? 'até '
        : ''

    return `${titulo}: ${prefix}${normalizeRangeValue(first.tipo, first.valor)}`
  }).join('\n')
}

function normalizeProcessStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'criado') return { label: 'Criado', tone: 'success' as const }
  if (normalized === 'iniciado') return { label: 'Iniciado', tone: 'info' as const }
  if (normalized === 'cancelado') return { label: 'Cancelado', tone: 'warning' as const }
  if (normalized === 'finalizado') return { label: 'Finalizado', tone: 'neutral' as const }
  if (normalized === 'erro') return { label: 'Erro', tone: 'danger' as const }
  return { label: status || '-', tone: 'neutral' as const }
}

function normalizeLogType(tipo: string) {
  const normalized = tipo.trim().toLowerCase()
  if (normalized === 'informacao') return { label: 'Informação', tone: 'success' as const }
  if (normalized === 'atencao') return { label: 'Atenção', tone: 'warning' as const }
  if (normalized === 'erro') return { label: 'Erro', tone: 'danger' as const }
  return { label: tipo || '-', tone: 'neutral' as const }
}

export function normalizeRelatorioListRecord(input: unknown): RelatorioListRecord {
  const record = asRecord(input)
  const grupo = asRecord(record.grupo)
  const grupoNome = stripLegacyIconMarkup(toStringValue(grupo.nome))
  const nome = stripLegacyIconMarkup(toStringValue(record.nome))

  return {
    id: toStringValue(record.id),
    codigo: toStringValue(record.codigo),
    grupo: grupoNome || '-',
    nome: nome || '-',
    descricao: toStringValue(record.descricao),
    api: toStringValue(record.api),
  }
}

export function normalizeRelatorioListResponse(payload: unknown, fallback: { page: number; perPage: number }): RelatorioListResponse {
  const record = asRecord(payload)
  const rows = asArray(record.data).map(normalizeRelatorioListRecord)
  const meta = asRecord(record.meta)
  const total = toNumberValue(meta.total, rows.length)
  const page = toNumberValue(meta.current_page ?? meta.page, fallback.page)
  const perPage = toNumberValue(meta.per_page ?? meta.perPage, fallback.perPage)
  const from = rows.length ? toNumberValue(meta.from, (page - 1) * perPage + 1) : 0
  const to = rows.length ? toNumberValue(meta.to, from + rows.length - 1) : 0
  const pages = Math.max(1, toNumberValue(meta.last_page ?? meta.pages, Math.ceil(total / Math.max(1, perPage))))

  return {
    data: rows,
    meta: { total, from, to, page, pages, perPage },
  }
}

export function normalizeRelatorioFiltros(payload: unknown): RelatorioFiltroDinamico[] {
  const record = asRecord(payload)
  const header = asArray(record.header)

  return header.map((item) => {
    const field = asRecord(item)
    const posicaoOrdenacao = parseInteger(field.posicao_ordenacao)

    return {
      campo: toStringValue(field.campo),
      titulo: toStringValue(field.titulo) || toStringValue(field.campo),
      tipo: toStringValue(field.tipo) || 'texto',
      ordenacao: toStringValue(field.ordenacao) as 'asc' | 'desc' | '',
      posicaoOrdenacao,
    }
  }).filter((field) => field.campo)
}

export function normalizeRelatorioDetail(recordInput: unknown, headerPayload: unknown): RelatorioDetail {
  const record = normalizeRelatorioListRecord(recordInput)
  return {
    id: record.id,
    codigo: record.codigo,
    nome: record.nome,
    grupo: record.grupo,
    descricao: record.descricao,
    api: record.api,
    filtros: normalizeRelatorioFiltros(headerPayload),
  }
}

export function normalizeRelatorioProcessoRecord(input: unknown): RelatorioProcessoRecord {
  const record = asRecord(input)
  const campos = asArray(record.campos).map((item) => {
    const campo = asRecord(item)
    return {
      campo: toStringValue(campo.campo),
      tipo: toStringValue(campo.tipo),
      titulo: toStringValue(campo.titulo),
      operador: toStringValue(campo.operador),
      valor: toStringValue(campo.valor),
    } satisfies RelatorioProcessoCampo
  })
  const status = toStringValue(record.status)
  const normalizedStatus = normalizeProcessStatus(status)
  const arquivo = toStringValue(record.arquivo)

  return {
    id: toStringValue(record.id),
    usuarioNome: toStringValue(asRecord(record.usuario).nome) || '-',
    campos,
    camposResumo: summarizeCampos(campos),
    createdAt: formatDateTime(toStringValue(record.created_at)),
    status,
    statusLabel: normalizedStatus.label,
    statusTone: normalizedStatus.tone,
    arquivo,
    canCancel: status === 'criado',
    canReprocess: status === 'erro',
    canDownload: status === 'finalizado' && !!arquivo,
  }
}

export function normalizeRelatorioProcessosResponse(payload: unknown, fallback: { page: number; perPage: number }): RelatorioProcessosResponse {
  const record = asRecord(payload)
  const rows = asArray(record.data).map(normalizeRelatorioProcessoRecord)
  const meta = asRecord(record.meta)
  const total = toNumberValue(meta.total, rows.length)
  const page = toNumberValue(meta.current_page ?? meta.page, fallback.page)
  const perPage = toNumberValue(meta.per_page ?? meta.perPage, fallback.perPage)
  const from = rows.length ? toNumberValue(meta.from, (page - 1) * perPage + 1) : 0
  const to = rows.length ? toNumberValue(meta.to, from + rows.length - 1) : 0
  const pages = Math.max(1, toNumberValue(meta.last_page ?? meta.pages, Math.ceil(total / Math.max(1, perPage))))

  return {
    data: rows,
    meta: { total, from, to, page, pages, perPage },
  }
}

export function normalizeRelatorioProcessoLogRecord(input: unknown): RelatorioProcessoLogRecord {
  const record = asRecord(input)
  const tipo = toStringValue(record.tipo)
  const normalizedType = normalizeLogType(tipo)

  return {
    id: toStringValue(record.id),
    createdAt: formatDateTime(toStringValue(record.created_at)),
    tipo,
    tipoLabel: normalizedType.label,
    tipoTone: normalizedType.tone,
    mensagem: toStringValue(record.mensagem) || '-',
  }
}

export function normalizeRelatorioProcessoLogsResponse(payload: unknown, fallback: { page: number; perPage: number }): RelatorioProcessoLogsResponse {
  const record = asRecord(payload)
  const rows = asArray(record.data).map(normalizeRelatorioProcessoLogRecord)
  const meta = asRecord(record.meta)
  const total = toNumberValue(meta.total, rows.length)
  const page = toNumberValue(meta.current_page ?? meta.page, fallback.page)
  const perPage = toNumberValue(meta.per_page ?? meta.perPage, fallback.perPage)
  const from = rows.length ? toNumberValue(meta.from, (page - 1) * perPage + 1) : 0
  const to = rows.length ? toNumberValue(meta.to, from + rows.length - 1) : 0
  const pages = Math.max(1, toNumberValue(meta.last_page ?? meta.pages, Math.ceil(total / Math.max(1, perPage))))

  return {
    data: rows,
    meta: { total, from, to, page, pages, perPage },
  }
}

export function createRelatorioFilterDraft(fields: RelatorioFiltroDinamico[]) {
  const draft: Record<string, string> = {}
  for (const field of fields) {
    if (field.tipo === 'data' || field.tipo === 'inteiro' || field.tipo === 'valor') {
      draft[`${field.campo}__start`] = ''
      draft[`${field.campo}__end`] = ''
      continue
    }

    draft[field.campo] = ''
  }

  return draft
}
