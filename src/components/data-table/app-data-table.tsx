'use client'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { SortableHeader } from '@/src/components/ui/sortable-header'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import type { AppDataTableBreakpoint, AppDataTableColumn, AppDataTableRowAction } from '@/src/components/data-table/types'
import { useI18n } from '@/src/i18n/use-i18n'

type AppDataTablePagination = {
  from: number
  to: number
  total: number
  page: number
  pages: number
  perPage?: number
}

type AppDataTablePageSize = {
  value: number
  options: number[]
  onChange: (value: number) => void
}

type AppDataTableSort<TColumn extends string> = {
  activeColumn: TColumn
  direction: 'asc' | 'desc'
  onToggle: (column: TColumn) => void
}

type AppDataTableMobileCard<TItem> = {
  title: (item: TItem) => ReactNode
  subtitle?: (item: TItem) => ReactNode
  meta?: (item: TItem) => ReactNode
  badges?: (item: TItem) => ReactNode
}

type AppDataTableProps<TItem, TColumn extends string = string, TFilters = never> = {
  rows: TItem[]
  getRowId: (item: TItem) => string
  emptyMessage: string
  columns: AppDataTableColumn<TItem, TFilters>[]
  mobileCard: AppDataTableMobileCard<TItem>
  sort?: AppDataTableSort<TColumn>
  rowActions?: (item: TItem) => AppDataTableRowAction<TItem>[]
  actionsLabel?: string
  actionsColumnClassName?: string
  expandedRowIds?: string[]
  onToggleExpandedRow?: (id: string) => void
  renderExpandedRow?: (item: TItem) => ReactNode
  selectable?: boolean
  selectedIds?: string[]
  allSelected?: boolean
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
  pagination?: AppDataTablePagination
  onPageChange?: (page: number) => void
  pageSize?: AppDataTablePageSize
}

function getVisibilityClasses(visibility: AppDataTableBreakpoint | undefined) {
  switch (visibility) {
    case 'lg':
      return { th: 'hidden lg:table-cell', td: 'hidden lg:table-cell' }
    case 'xl':
      return { th: 'hidden xl:table-cell', td: 'hidden xl:table-cell' }
    case '2xl':
      return { th: 'hidden 2xl:table-cell', td: 'hidden 2xl:table-cell' }
    default:
      return { th: '', td: '' }
  }
}

function actionButtonClasses(tone: AppDataTableRowAction<unknown>['tone']) {
  return tone === 'danger'
    ? 'border border-rose-200 bg-white text-rose-700'
    : 'border border-[#e6dfd3] bg-white text-slate-700 transition hover:border-[#cfc3ad] hover:text-slate-950'
}

function DataTableActions<TItem>({
  item,
  actions,
}: {
  item: TItem
  actions: AppDataTableRowAction<TItem>[]
}) {
  const visibleActions = actions.filter((action) => action.visible !== false)

  if (!visibleActions.length) {
    return null
  }

  return (
    <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
      {visibleActions.map((action) => {
        const Icon = action.icon

        return (
          <TooltipIconButton key={action.id} label={action.label}>
            {action.href ? (
              <Link
                href={action.href}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${actionButtonClasses(action.tone)}`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => action.onClick?.(item)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${actionButtonClasses(action.tone)}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            )}
          </TooltipIconButton>
        )
      })}
    </div>
  )
}

export function AppDataTable<TItem, TColumn extends string = string, TFilters = never>({
  rows,
  getRowId,
  emptyMessage,
  columns,
  mobileCard,
  sort,
  rowActions,
  actionsLabel = 'Acoes',
  actionsColumnClassName = 'w-[232px] whitespace-nowrap',
  expandedRowIds = [],
  onToggleExpandedRow,
  renderExpandedRow,
  selectable = false,
  selectedIds = [],
  allSelected = false,
  onToggleSelect,
  onToggleSelectAll,
  pagination,
  onPageChange,
  pageSize,
}: AppDataTableProps<TItem, TColumn, TFilters>) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="space-y-4 md:hidden">
        {rows.length ? (
          rows.map((item) => {
            const rowId = getRowId(item)
            const isExpanded = expandedRowIds.includes(rowId)

            return (
              <div
                key={rowId}
                className="rounded-[1.4rem] border border-[#ebe4d8] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-950">{mobileCard.title(item)}</div>
                    {mobileCard.subtitle ? (
                      <div className="mt-1 text-sm text-slate-600">{mobileCard.subtitle(item)}</div>
                    ) : null}
                    {mobileCard.meta ? (
                      <div className="mt-1 text-xs text-slate-500">{mobileCard.meta(item)}</div>
                    ) : null}
                  </div>
                  {renderExpandedRow ? (
                    <button
                      type="button"
                      onClick={() => onToggleExpandedRow?.(rowId)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dfd3] text-slate-600"
                    >
                      <ChevronDown className={['h-4 w-4 transition', isExpanded ? 'rotate-180' : ''].join(' ')} />
                    </button>
                  ) : null}
                </div>

                {mobileCard.badges ? <div className="mt-3 flex flex-wrap gap-2">{mobileCard.badges(item)}</div> : null}

                {rowActions ? (
                  <div className="mt-4">
                    <DataTableActions item={item} actions={rowActions(item)} />
                  </div>
                ) : null}

                {renderExpandedRow && isExpanded ? <div className="mt-4">{renderExpandedRow(item)}</div> : null}
              </div>
            )
          })
        ) : (
          <div className="rounded-[1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full table-auto border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                {selectable ? (
                  <th className="w-12 border-b border-[#ece5d9] px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleSelectAll}
                      className="h-4 w-4 rounded border-[#d8ccb7] text-slate-950 focus:ring-[#efe7d7]"
                    />
                  </th>
                ) : null}
                {renderExpandedRow ? <th className="w-12 border-b border-[#ece5d9] px-3 py-3" /> : null}
                {columns.map((column) => {
                  const visibilityClasses = getVisibilityClasses(column.visibility)

                  return (
                    <th key={column.id} className={`overflow-hidden whitespace-nowrap border-b border-[#ece5d9] px-3 py-3 ${visibilityClasses.th} ${column.thClassName ?? ''}`.trim()}>
                      {column.header ?? (column.sortKey && sort && column.label ? (
                        <SortableHeader
                          label={column.label}
                          column={column.sortKey as TColumn}
                          activeColumn={sort.activeColumn}
                          direction={sort.direction}
                          onToggle={sort.onToggle}
                        />
                      ) : (
                        column.label
                      ))}
                    </th>
                  )
                })}
                {rowActions ? (
                  <th className={`overflow-hidden whitespace-nowrap border-b border-[#ece5d9] px-3 py-3 ${actionsColumnClassName}`.trim()}>
                    {actionsLabel}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((item) => {
                  const rowId = getRowId(item)
                  const isExpanded = expandedRowIds.includes(rowId)

                  return (
                    <Fragment key={rowId}>
                      <tr className="align-top">
                        {selectable ? (
                          <td className="border-b border-[#f0eadf] px-3 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(rowId)}
                              onChange={() => onToggleSelect?.(rowId)}
                              className="h-4 w-4 rounded border-[#d8ccb7] text-slate-950 focus:ring-[#efe7d7]"
                            />
                          </td>
                        ) : null}
                        {renderExpandedRow ? (
                          <td className="border-b border-[#f0eadf] px-3 py-4">
                            <button
                              type="button"
                              onClick={() => onToggleExpandedRow?.(rowId)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dfd3] text-slate-600"
                            >
                              <ChevronDown
                                className={['h-4 w-4 transition', isExpanded ? 'rotate-180' : ''].join(' ')}
                              />
                            </button>
                          </td>
                        ) : null}
                        {columns.map((column) => {
                          const visibilityClasses = getVisibilityClasses(column.visibility)

                          return (
                            <td key={`${rowId}-${column.id}`} className={`border-b border-[#f0eadf] px-3 py-4 align-middle ${visibilityClasses.td} ${column.tdClassName ?? ''}`.trim()}>
                              <div className="min-w-0 overflow-hidden">
                                {column.cell(item)}
                              </div>
                            </td>
                          )
                        })}
                        {rowActions ? (
                          <td className={`border-b border-[#f0eadf] px-3 py-4 ${actionsColumnClassName}`.trim()}>
                            <DataTableActions item={item} actions={rowActions(item)} />
                          </td>
                        ) : null}
                      </tr>
                      {renderExpandedRow && isExpanded ? (
                        <tr>
                          <td
                            colSpan={columns.length + (selectable ? 1 : 0) + 1 + (rowActions ? 1 : 0)}
                            className="border-b border-[#f0eadf] bg-[#fcfaf5] px-3 py-4"
                          >
                            {renderExpandedRow(item)}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (renderExpandedRow ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="px-3 py-10 text-center text-sm text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && onPageChange ? (
        <div className="mt-4 flex flex-col gap-3 rounded-[1.1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div>
              {t('table.showingResults', 'Exibindo {{from}} a {{to}} de {{total}} registros', {
                from: pagination.from,
                to: pagination.to,
                total: pagination.total,
              })}
            </div>
            {pageSize ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span>{t('table.itemsPerPage', 'Itens por pagina')}</span>
                <select
                  value={String(pageSize.value)}
                  onChange={(event) => pageSize.onChange(Number(event.target.value))}
                  className="h-10 rounded-full border border-[#e6dfd3] bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-[#efe7d7]"
                >
                  {pageSize.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e6dfd3] bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="rounded-full border border-[#e6dfd3] bg-white px-4 py-2 font-semibold text-slate-900">
              {t('table.pageOf', 'Pagina {{page}} de {{pages}}', {
                page: pagination.page,
                pages: pagination.pages || 1,
              })}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pagination.pages || pagination.page, pagination.page + 1))}
              disabled={pagination.page >= (pagination.pages || 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e6dfd3] bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
