export type SqlDataSource = 'agileecommerce' | 'agilesync' | 'erp'

export type SqlEditorResultRow = Record<string, unknown>

export type SqlEditorPagination = {
  page: number
  perPage: number
  total: number | null
  totalPages: number | null
  hasMore: boolean
}

export type SqlEditorExecuteResponse = {
  raw: unknown
  rows: SqlEditorResultRow[]
  pagination: SqlEditorPagination
}

export type SavedSqlQuery = {
  id: string
  nome: string
  descricao: string
  fonteDados: SqlDataSource | string
  usuarioNome: string
  publico: boolean
  sql: string
  criadoEm: string
}
