export type SavedSqlQuery = {
  id: string
  nome: string
  descricao: string
  fonteDados: string
  usuarioNome: string
  publico: boolean
  sql: string
  criadoEm: string
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
  return String(value ?? '').trim()
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function mapSavedSqlQuery(value: unknown): SavedSqlQuery {
  const source = asRecord(value)

  return {
    id: asString(source.id),
    nome: asString(source.nome_consulta || source.nome),
    descricao: asString(source.descricao_consulta || source.descricao),
    fonteDados: asString(source.fonte_dados),
    usuarioNome: asString(source.nome_usuario),
    publico: asBoolean(source.publico),
    sql: asString(source.sql),
    criadoEm: asString(source.dthr || source.created_at),
  }
}

export function normalizeSqlQueryRows(payload: unknown) {
  const source = asRecord(payload)

  if (Array.isArray(source.data)) {
    return source.data.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
  }

  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
  }

  return []
}

export function buildSqlQueryPagination(
  payload: unknown,
  page: number,
  perPage: number,
  rows: Array<Record<string, unknown>>,
) {
  const source = asRecord(payload)
  const meta = asRecord(source.meta)
  const total = Number(meta.total)
  const totalPages = Number(meta.total_pages || meta.last_page)

  return {
    page,
    perPage,
    total: Number.isFinite(total) ? total : null,
    totalPages: Number.isFinite(totalPages) ? totalPages : null,
    hasMore: Number.isFinite(total)
      ? page * perPage < total
      : rows.length >= perPage,
  }
}
