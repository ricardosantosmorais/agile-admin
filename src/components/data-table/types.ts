'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type AppDataTableBreakpoint = 'always' | 'lg' | 'xl' | '2xl'

export type AppDataTableFilterOption = {
  value: string
  label: string
}

type AppDataTableBaseFilter<TFilters> = {
  id: string
  label: string
  visibility?: AppDataTableBreakpoint
  widthClassName?: string
  summaryLabel?: string
  // Allows each screen to override the summary when the default text is not enough.
  getSummary?: (filters: TFilters) => string | null
}

export type AppDataTableTextFilter<TFilters> = AppDataTableBaseFilter<TFilters> & {
  kind: 'text'
  key: keyof TFilters
  placeholder?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
}

export type AppDataTableSelectFilter<TFilters> = AppDataTableBaseFilter<TFilters> & {
  kind: 'select'
  key: keyof TFilters
  options: AppDataTableFilterOption[]
  emptyLabel?: string
}

export type AppDataTableDateRangeFilter<TFilters> = AppDataTableBaseFilter<TFilters> & {
  kind: 'date-range'
  fromKey: keyof TFilters
  toKey: keyof TFilters
}

export type AppDataTableNumberRangeFilter<TFilters> = AppDataTableBaseFilter<TFilters> & {
  kind: 'number-range'
  fromKey: keyof TFilters
  toKey: keyof TFilters
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
}

export type AppDataTableCustomFilter<TFilters> = AppDataTableBaseFilter<TFilters> & {
  kind: 'custom'
  render: (context: {
    draft: TFilters
    patchDraft: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void
  }) => ReactNode
}

export type AppDataTableFilterConfig<TFilters> =
  | AppDataTableTextFilter<TFilters>
  | AppDataTableSelectFilter<TFilters>
  | AppDataTableDateRangeFilter<TFilters>
  | AppDataTableNumberRangeFilter<TFilters>
  | AppDataTableCustomFilter<TFilters>

export type AppDataTableColumn<TItem, TFilters = never> = {
  id: string
  label?: string
  header?: ReactNode
  cell: (item: TItem) => ReactNode
  sortKey?: string
  visibility?: AppDataTableBreakpoint
  thClassName?: string
  tdClassName?: string
  filter?: AppDataTableFilterConfig<TFilters>
}

export type AppDataTableRowAction<TItem> = {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  onClick?: (item: TItem) => void
  tone?: 'default' | 'danger'
  visible?: boolean
}
