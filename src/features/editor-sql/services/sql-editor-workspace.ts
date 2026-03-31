import type { SqlDataSource, SqlEditorExecuteResponse } from '@/src/features/editor-sql/services/sql-editor-types'

export type SqlEditorWorkspaceTabSnapshot = {
  id: string
  title: string
  sql: string
  fonteDados: SqlDataSource
  savedQueryId: string
  dirty: boolean
  result: SqlEditorExecuteResponse | null
  search: string
}

export type SqlEditorWorkspaceSnapshot = {
  activeTabId: string
  resultMode: 'table' | 'json'
  splitNormal: number
  splitFullscreen: number
  tabs: SqlEditorWorkspaceTabSnapshot[]
}

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
  return String(value ?? '').trim()
}

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asSqlDataSource(value: unknown): SqlDataSource {
  if (value === 'agileecommerce' || value === 'agilesync' || value === 'erp') {
    return value
  }

  return 'agileecommerce'
}

function isResult(value: unknown): value is SqlEditorExecuteResponse {
  const source = asRecord(value)
  return Array.isArray(source.rows) && typeof source.pagination === 'object' && source.pagination !== null
}

function getStorage(storage?: StorageLike) {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function getSqlEditorWorkspaceStorageKey(userId: string, tenantId: string) {
  return `admin-v2:sql-editor:${tenantId}:${userId}`
}

export function loadSqlEditorWorkspace(storageKey: string, storage?: StorageLike): SqlEditorWorkspaceSnapshot | null {
  const target = getStorage(storage)
  if (!target) return null

  try {
    const raw = target.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    const source = asRecord(parsed)
    const tabsSource = Array.isArray(source.tabs) ? source.tabs : []
    const tabs = tabsSource
      .map((item) => {
        const row = asRecord(item)
        const id = asString(row.id)
        if (!id) return null

        return {
          id,
          title: asString(row.title) || 'Consulta',
          sql: asString(row.sql),
          fonteDados: asSqlDataSource(row.fonteDados),
          savedQueryId: asString(row.savedQueryId),
          dirty: row.dirty === true || row.dirty === 1 || row.dirty === '1',
          result: isResult(row.result) ? row.result : null,
          search: asString(row.search),
        } satisfies SqlEditorWorkspaceTabSnapshot
      })
      .filter((item): item is SqlEditorWorkspaceTabSnapshot => Boolean(item))

    if (!tabs.length) return null

    const activeTabId = asString(source.activeTabId)
    const activeExists = tabs.some((tab) => tab.id === activeTabId)

    return {
      activeTabId: activeExists ? activeTabId : tabs[0].id,
      resultMode: source.resultMode === 'json' ? 'json' : 'table',
      splitNormal: asNumber(source.splitNormal, 36),
      splitFullscreen: asNumber(source.splitFullscreen, 36),
      tabs,
    }
  } catch {
    return null
  }
}

export function saveSqlEditorWorkspace(storageKey: string, snapshot: SqlEditorWorkspaceSnapshot, storage?: StorageLike) {
  const target = getStorage(storage)
  if (!target) return

  target.setItem(storageKey, JSON.stringify(snapshot))
}

export function clearSqlEditorWorkspace(storageKey: string, storage?: StorageLike) {
  const target = getStorage(storage)
  if (!target) return

  target.removeItem(storageKey)
}
