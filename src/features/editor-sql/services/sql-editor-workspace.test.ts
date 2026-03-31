import { describe, expect, it } from 'vitest'
import {
  getSqlEditorWorkspaceStorageKey,
  loadSqlEditorWorkspace,
  saveSqlEditorWorkspace,
} from '@/src/features/editor-sql/services/sql-editor-workspace'

function createMemoryStorage() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('sql-editor-workspace', () => {
  it('gera chave estável por tenant e usuário', () => {
    expect(getSqlEditorWorkspaceStorageKey('18', '1715520686464192')).toBe('admin-v2:sql-editor:1715520686464192:18')
  })

  it('salva e recarrega o workspace do editor', () => {
    const storage = createMemoryStorage()
    const key = getSqlEditorWorkspaceStorageKey('18', '1715520686464192')

    saveSqlEditorWorkspace(key, {
      activeTabId: 'tab-1',
      resultMode: 'json',
      splitNormal: 38,
      splitFullscreen: 41,
      tabs: [
        {
          id: 'tab-1',
          title: 'Consulta principal',
          sql: 'select * from clientes limit 10',
          fonteDados: 'agileecommerce',
          savedQueryId: '55',
          dirty: true,
          result: {
            raw: { data: [{ id: 1 }] },
            rows: [{ id: 1 }],
            pagination: {
              page: 1,
              perPage: 100,
              total: 1,
              totalPages: 1,
              hasMore: false,
            },
          },
          search: '',
        },
      ],
    }, storage)

    expect(loadSqlEditorWorkspace(key, storage)).toEqual({
      activeTabId: 'tab-1',
      resultMode: 'json',
      splitNormal: 38,
      splitFullscreen: 41,
      tabs: [
        {
          id: 'tab-1',
          title: 'Consulta principal',
          sql: 'select * from clientes limit 10',
          fonteDados: 'agileecommerce',
          savedQueryId: '55',
          dirty: true,
          result: {
            raw: { data: [{ id: 1 }] },
            rows: [{ id: 1 }],
            pagination: {
              page: 1,
              perPage: 100,
              total: 1,
              totalPages: 1,
              hasMore: false,
            },
          },
          search: '',
        },
      ],
    })
  })

  it('retorna null quando o snapshot é inválido', () => {
    const storage = createMemoryStorage()
    const key = getSqlEditorWorkspaceStorageKey('18', '1715520686464192')
    storage.setItem(key, '{"tabs":[]}')

    expect(loadSqlEditorWorkspace(key, storage)).toBeNull()
  })
})
