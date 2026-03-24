'use client'

import { useEffect, useMemo, useState } from 'react'
import { readSessionState, writeSessionState } from '@/src/components/data-table/table-persistence'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import type { CrudDataClient, CrudListFilters, CrudListResponse, CrudModuleConfig } from '@/src/components/crud-base/types'

export function useCrudListController(config: CrudModuleConfig, client: CrudDataClient, canDelete: boolean) {
  const storageKey = `${config.key}-list-state`
  const persistedState = useMemo(() => {
    const parsed = readSessionState<{ filters?: CrudListFilters; filtersDraft?: CrudListFilters; filtersExpanded?: boolean }>(storageKey)
    if (!parsed?.filters || !parsed.filtersDraft) {
      return null
    }

    return {
      filters: { ...config.defaultFilters, ...parsed.filters },
      filtersDraft: { ...config.defaultFilters, ...parsed.filtersDraft },
      filtersExpanded: parsed.filtersExpanded === true,
    }
  }, [config.defaultFilters, storageKey])

  const [filters, setFilters] = useState<CrudListFilters>(persistedState?.filters ?? config.defaultFilters)
  const [filtersDraft, setFiltersDraft] = useState<CrudListFilters>(persistedState?.filtersDraft ?? config.defaultFilters)
  const [filtersExpanded, setFiltersExpanded] = useState(persistedState?.filtersExpanded ?? false)
  const [response, setResponse] = useState<CrudListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)

  const rows = response?.data ?? []
  const meta = response?.meta

  const tableState = useDataTableState({
    rows,
    getRowId: (record) => record.id,
    filters,
    setFilters,
    setFiltersDraft,
  })
  const { clearSelection } = tableState

  useEffect(() => {
    let alive = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const nextResponse = await client.list(filters, config.listEmbed)
        if (!alive) return
        setResponse(nextResponse)
        clearSelection()
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError : new Error('Could not load the records.'))
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [clearSelection, client, config.listEmbed, filters])

  useEffect(() => {
    writeSessionState(storageKey, { filters, filtersDraft, filtersExpanded })
  }, [filters, filtersDraft, filtersExpanded, storageKey])

  function patchDraft<K extends keyof CrudListFilters>(key: K, value: CrudListFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value }))
  }

  function applyFilters() {
    setFilters({ ...filtersDraft, page: 1 })
  }

  function clearFilters() {
    setFilters(config.defaultFilters)
    setFiltersDraft(config.defaultFilters)
  }

  function setPerPage(perPage: number) {
    setFilters((current) => ({ ...current, page: 1, perPage }))
    setFiltersDraft((current) => ({ ...current, page: 1, perPage }))
  }

  function refreshList() {
    setFilters((current) => ({ ...current }))
  }

  async function handleDelete(ids: string[]) {
    await client.delete(ids)
    clearSelection()
    setConfirmDeleteIds(null)
    refreshList()
  }

  return {
    filters,
    filtersDraft,
    filtersExpanded,
    rows,
    meta,
    isLoading,
    error,
    confirmDeleteIds,
    deleteSelectionVisible: canDelete && tableState.selectedIds.length > 0,
    tableState,
    setFiltersExpanded,
    setConfirmDeleteIds,
    patchDraft,
    applyFilters,
    clearFilters,
    setPerPage,
    refreshList,
    handleDelete,
  }
}
