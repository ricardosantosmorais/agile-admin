import { httpClient } from '@/src/services/http/http-client'
import type { SavedSqlQuery, SqlDataSource, SqlEditorExecuteResponse } from '@/src/features/editor-sql/services/sql-editor-types'

export const sqlEditorClient = {
  async execute(input: {
    fonteDados: SqlDataSource
    sql: string
    page: number
    perPage: number
  }) {
    return httpClient<SqlEditorExecuteResponse>('/api/editor-sql/execute', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async listSavedQueries() {
    const response = await httpClient<{ data: SavedSqlQuery[] }>('/api/editor-sql/queries')
    return response.data
  },

  async saveQuery(input: {
    id?: string
    nome: string
    descricao: string
    publico: boolean
    fonteDados: SqlDataSource
    sql: string
  }) {
    return httpClient<{ message: string; data: { id: string } }>('/api/editor-sql/queries', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
}
