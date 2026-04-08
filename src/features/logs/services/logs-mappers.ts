import { asArray, asRecord, asString } from '@/src/lib/api-payload'
import { getLogModuleLabel } from '@/src/features/logs/services/logs-module-map'
import type { LogDetailRecord, LogsListFilters, LogsListRecord, LogsListResponse } from '@/src/features/logs/services/logs-types'

type ApiMeta = {
  total?: unknown
  from?: unknown
  to?: unknown
  page?: unknown
  pages?: unknown
  perpage?: unknown
  perPage?: unknown
}

function toBooleanAction(value: string): LogsListRecord['acao'] {
  if (value === 'inclusao' || value === 'alteracao' || value === 'exclusao') {
    return value
  }

  return ''
}

function parseJsonSnapshot(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return null
  }

  return normalized
}

function mapListRecord(input: unknown): LogsListRecord {
  const record = asRecord(input)
  const usuario = asRecord(record.usuario)
  const modulo = asString(record.modulo).toUpperCase()

  return {
    id: asString(record.id),
    id_registro: asString(record.id_registro),
    modulo,
    modulo_nome: getLogModuleLabel(modulo),
    id_usuario: asString(record.id_usuario),
    usuario_nome: asString(usuario.nome),
    data: asString(record.data),
    acao: toBooleanAction(asString(record.acao)),
  }
}

export function normalizeLogsListResponse(payload: unknown, fallbackFilters: LogsListFilters): LogsListResponse {
  const root = asRecord(payload)
  const meta = asRecord(root.meta) as ApiMeta
  const lookups = asRecord(root.lookups)
  const users = asArray(lookups.users).map((user) => {
    const parsed = asRecord(user)
    return {
      id: asString(parsed.id),
      nome: asString(parsed.nome),
    }
  }).filter((user) => user.id && user.nome)

  return {
    data: asArray(root.data).map(mapListRecord),
    meta: {
      total: Number(meta.total || 0),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
      page: Number(meta.page || fallbackFilters.page),
      pages: Number(meta.pages || 1),
      perPage: Number(meta.perPage || meta.perpage || fallbackFilters.perPage),
    },
    lookups: {
      users,
    },
  }
}

export function normalizeLogDetail(payload: unknown): LogDetailRecord {
  const record = asRecord(payload)
  const usuario = asRecord(record.usuario)
  const modulo = asString(record.modulo).toUpperCase()

  return {
    id: asString(record.id),
    id_registro: asString(record.id_registro),
    modulo,
    modulo_nome: getLogModuleLabel(modulo),
    data: asString(record.data),
    acao: toBooleanAction(asString(record.acao)),
    descricao: asString(record.descricao),
    usuario_nome: asString(usuario.nome),
    json_registro_anterior: parseJsonSnapshot(record.json_registro_anterior),
    json_registro_novo: parseJsonSnapshot(record.json_registro_novo),
  }
}
