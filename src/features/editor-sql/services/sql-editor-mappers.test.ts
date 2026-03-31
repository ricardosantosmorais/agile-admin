import { describe, expect, it } from 'vitest'
import {
  buildSqlQueryPagination,
  mapSavedSqlQuery,
  normalizeSqlQueryRows,
} from '@/src/features/editor-sql/services/sql-editor-mappers'

describe('sql-editor-mappers', () => {
  it('normaliza linhas vindas em payload com data', () => {
    expect(normalizeSqlQueryRows({
      data: [
        { id: 1, nome: 'Teste' },
        null,
        'invalido',
      ],
    })).toEqual([{ id: 1, nome: 'Teste' }])
  })

  it('monta a paginação com meta da API externa', () => {
    expect(buildSqlQueryPagination(
      { meta: { total: 240, total_pages: 3 } },
      2,
      100,
      [{ id: 1 }],
    )).toEqual({
      page: 2,
      perPage: 100,
      total: 240,
      totalPages: 3,
      hasMore: true,
    })
  })

  it('mapeia consulta salva com nomes do legado', () => {
    expect(mapSavedSqlQuery({
      id: '10',
      nome_consulta: 'Pedidos recentes',
      descricao_consulta: 'Top pedidos',
      fonte_dados: 'agileecommerce',
      nome_usuario: 'Ricardo',
      publico: '1',
      sql: 'select * from pedidos',
      dthr: '2026-03-31 09:00:00',
    })).toEqual({
      id: '10',
      nome: 'Pedidos recentes',
      descricao: 'Top pedidos',
      fonteDados: 'agileecommerce',
      usuarioNome: 'Ricardo',
      publico: true,
      sql: 'select * from pedidos',
      criadoEm: '2026-03-31 09:00:00',
    })
  })
})
