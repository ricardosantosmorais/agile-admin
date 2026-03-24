'use client'

import { useCallback, useMemo, useState } from 'react'

type SortableFilters<TOrder extends string> = {
  page: number
  orderBy: TOrder
  sort: 'asc' | 'desc'
}

type UseDataTableStateParams<TItem, TFilters extends SortableFilters<TOrder>, TOrder extends string> = {
  rows: TItem[]
  getRowId: (item: TItem) => string
  filters: TFilters
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>
  setFiltersDraft: React.Dispatch<React.SetStateAction<TFilters>>
}

export function useDataTableState<TItem, TFilters extends SortableFilters<TOrder>, TOrder extends string>({
  rows,
  getRowId,
  filters,
  setFilters,
  setFiltersDraft,
}: UseDataTableStateParams<TItem, TFilters, TOrder>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([])

  const rowIds = useMemo(() => rows.map((item) => getRowId(item)), [rows, getRowId])
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id))

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : rowIds)
  }, [allSelected, rowIds])

  const toggleExpandedRow = useCallback((id: string) => {
    setExpandedRowIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((current) => ({ ...current, page }))
    setFiltersDraft((current) => ({ ...current, page }))
  }, [setFilters, setFiltersDraft])

  const toggleSort = useCallback((column: TOrder) => {
    const nextSort = filters.orderBy === column && filters.sort === 'asc' ? 'desc' : 'asc'

    setFilters((current) => ({
      ...current,
      page: 1,
      orderBy: column,
      sort: nextSort,
    }))
    setFiltersDraft((current) => ({
      ...current,
      page: 1,
      orderBy: column,
      sort: nextSort,
    }))
  }, [filters.orderBy, filters.sort, setFilters, setFiltersDraft])

  return {
    selectedIds,
    setSelectedIds,
    expandedRowIds,
    setExpandedRowIds,
    allSelected,
    clearSelection,
    toggleSelection,
    toggleSelectAll,
    toggleExpandedRow,
    setPage,
    toggleSort,
  }
}
