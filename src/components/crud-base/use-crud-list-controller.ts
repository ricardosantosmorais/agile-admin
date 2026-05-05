'use client'

import { useEffect, useMemo, useState } from 'react'
import { readSessionState, writeSessionState } from '@/src/components/data-table/table-persistence'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import type { CrudDataClient, CrudListFilters, CrudListRecord, CrudListResponse, CrudModuleConfig } from '@/src/components/crud-base/types'

export function useCrudListController(
  config: CrudModuleConfig,
  client: CrudDataClient,
  canDelete: boolean,
  canSelectRow?: (record: CrudListResponse['data'][number]) => boolean,
) {
  const { defaultFilters, key, listEmbed, normalizeRecord } = config
  const storageKey = `${key}-list-state`
  const persistedState = useMemo(() => {
    const parsed = readSessionState<{ filters?: CrudListFilters; filtersDraft?: CrudListFilters; filtersExpanded?: boolean }>(storageKey)
    if (!parsed?.filters || !parsed.filtersDraft) {
      return null
    }

    return {
      filters: { ...defaultFilters, ...parsed.filters },
      filtersDraft: { ...defaultFilters, ...parsed.filtersDraft },
      filtersExpanded: parsed.filtersExpanded === true,
    }
  }, [defaultFilters, storageKey])

  const [filters, setFilters] = useState<CrudListFilters>(persistedState?.filters ?? defaultFilters)
  const [filtersDraft, setFiltersDraft] = useState<CrudListFilters>(persistedState?.filtersDraft ?? defaultFilters)
  const [filtersExpanded, setFiltersExpanded] = useState(persistedState?.filtersExpanded ?? false)
  const [response, setResponse] = useState<CrudListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)

  const rows = response?.data ?? []
  const meta = response?.meta
  const selectableRowIds = canSelectRow
    ? rows.filter((row) => canSelectRow(row)).map((row) => row.id)
    : undefined

  const tableState = useDataTableState({
    rows,
    getRowId: (record) => record.id,
    selectableRowIds,
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
        const nextResponse = await client.list(filters, listEmbed)
        if (!alive) return
        setResponse(normalizeRecord
          ? {
              ...nextResponse,
              data: nextResponse.data.map((record) => (normalizeRecord(record) ?? record) as CrudListRecord),
            }
          : nextResponse)
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
  }, [clearSelection, client, filters, listEmbed, normalizeRecord])

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
    setFilters(defaultFilters)
    setFiltersDraft(defaultFilters)
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
