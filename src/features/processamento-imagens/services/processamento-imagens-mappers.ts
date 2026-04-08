import { formatDateTime } from '@/src/lib/date-time'
import type {
  ProcessoImagemDetail,
  ProcessoImagemLogRecord,
  ProcessoImagemRecord,
  ProcessamentoImagensResponse,
} from '@/src/features/processamento-imagens/services/processamento-imagens-types'

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

export function normalizeProcessoImagemRecord(value: unknown): ProcessoImagemRecord {
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
    canCancel: status === 'criado',
    canReprocess: status === 'erro',
  }
}

function normalizeProcessoImagemLog(value: unknown): ProcessoImagemLogRecord {
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

export function normalizeProcessoImagemDetail(value: unknown): ProcessoImagemDetail {
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
    logs: asArray(record.logs).map(normalizeProcessoImagemLog),
  }
}

export function normalizeProcessamentoImagensResponse(payload: unknown, fallback: { page: number; perPage: number }): ProcessamentoImagensResponse {
  const record = asRecord(payload)
  const data = asArray(record.data).map(normalizeProcessoImagemRecord)
  const meta = asRecord(record.meta)

  const total = asNumber(meta.total, data.length)
  const page = asNumber(meta.current_page ?? meta.page, fallback.page)
  const perPage = asNumber(meta.per_page ?? meta.perPage, fallback.perPage)
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
