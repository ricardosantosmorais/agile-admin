import { describe, expect, it } from 'vitest'
import { normalizeLogDetail, normalizeLogsListResponse } from '@/src/features/logs/services/logs-mappers'
import type { LogsListFilters } from '@/src/features/logs/services/logs-types'

const filters: LogsListFilters = {
  page: 2,
  perPage: 30,
  orderBy: 'data',
  sort: 'desc',
  id_registro: '',
  modulo: '',
  id_usuario: '',
  'data::ge': '',
  'data::le': '',
  acao: '',
}

describe('logs mappers', () => {
  it('normalizes list response with pagination defaults', () => {
    const result = normalizeLogsListResponse({
      data: [
        {
          id: '10',
          id_registro: '200',
          modulo: 'PED',
          id_usuario: '5',
          usuario: { nome: 'Admin' },
          data: '2026-04-01T10:00:00Z',
          acao: 'alteracao',
        },
      ],
      meta: {
        total: 1,
        from: 1,
        to: 1,
      },
    }, filters)

    expect(result.meta.page).toBe(2)
    expect(result.meta.perPage).toBe(30)
    expect(result.lookups.users).toEqual([])
    expect(result.data[0]).toEqual({
      id: '10',
      id_registro: '200',
      modulo: 'PED',
      modulo_nome: 'Pedido',
      id_usuario: '5',
      usuario_nome: 'Admin',
      data: '2026-04-01T10:00:00Z',
      acao: 'alteracao',
    })
  })

  it('normalizes detail json snapshots', () => {
    const detail = normalizeLogDetail({
      id: '12',
      id_registro: '300',
      modulo: 'CLI',
      data: '2026-04-02T11:00:00Z',
      acao: 'inclusao',
      descricao: 'Teste',
      usuario: { nome: 'Operador' },
      json_registro_anterior: '',
      json_registro_novo: '{"ok":true}',
    })

    expect(detail.json_registro_anterior).toBeNull()
    expect(detail.json_registro_novo).toBe('{"ok":true}')
    expect(detail.usuario_nome).toBe('Operador')
    expect(detail.modulo_nome).toBe('Cliente')
  })

  it('normalizes user lookups from list payload', () => {
    const result = normalizeLogsListResponse({
      data: [],
      meta: { total: 0 },
      lookups: {
        users: [{ id: '9', nome: 'Maria' }, { id: '', nome: 'Sem id' }],
      },
    }, filters)

    expect(result.lookups.users).toEqual([{ id: '9', nome: 'Maria' }])
  })
})
