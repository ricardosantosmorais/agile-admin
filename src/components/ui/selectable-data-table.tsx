'use client'

import type { ComponentType, ReactNode } from 'react'
import { EmptyTableRow } from '@/src/components/ui/empty-table-row'

export type SelectableDataTableColumn<TItem> = {
  header: string
  render: (item: TItem) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export type SelectableDataTableRowAction<TItem> = {
  label: string
  icon?: ComponentType<{ className?: string }>
  onClick: (item: TItem) => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

type SelectableDataTableProps<TItem> = {
  items: TItem[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  getRowId: (item: TItem) => string
  columns: Array<SelectableDataTableColumn<TItem>>
  emptyMessage: string
  actionsLabel?: string
  rowActions?: (item: TItem) => Array<SelectableDataTableRowAction<TItem>>
}

export function SelectableDataTable<TItem>({
  items,
  selectedIds,
  onSelectedIdsChange,
  getRowId,
  columns,
  emptyMessage,
  actionsLabel,
  rowActions,
}: SelectableDataTableProps<TItem>) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(getRowId(item)))
  const hasActions = Boolean(rowActions)

  function toggleAll(checked: boolean) {
    onSelectedIdsChange(checked ? items.map(getRowId) : [])
  }

  function toggleOne(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((currentId) => currentId !== id) : [...selectedIds, id],
    )
  }

  return (
    <div className="app-table-shell overflow-x-auto rounded-[1.1rem]">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="app-table-muted text-xs font-black uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
          <tr>
            <th className="w-14 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => toggleAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.header}
                className={`px-4 py-3 font-semibold ${column.headerClassName ?? ''}`.trim()}
              >
                {column.header}
              </th>
            ))}
            {hasActions ? (
              <th className="w-[180px] px-4 py-3 text-center font-semibold">
                {actionsLabel}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="bg-[color:var(--app-card-bg)]">
          {items.length ? (
            items.map((item) => {
              const rowId = getRowId(item)
              const actions = rowActions?.(item) ?? []
              return (
                <tr key={rowId} className="app-table-row-hover border-t border-line/60">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(rowId)}
                      onChange={() => toggleOne(rowId)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${rowId}-${column.header}`}
                      className={`px-4 py-4 ${column.cellClassName ?? ''}`.trim()}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  {hasActions ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {actions.map((action) => {
                          const Icon = action.icon
                          return (
                            <button
                              key={action.label}
                              type="button"
                              disabled={action.disabled}
                              onClick={() => action.onClick(item)}
                              className={[
                                'app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60',
                                action.tone === 'danger' ? 'text-rose-600' : '',
                              ].filter(Boolean).join(' ')}
                            >
                              {Icon ? <Icon className="h-4 w-4" /> : null}
                              {action.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  ) : null}
                </tr>
              )
            })
          ) : (
            <EmptyTableRow colSpan={columns.length + 1 + (hasActions ? 1 : 0)} message={emptyMessage} />
          )}
        </tbody>
      </table>
    </div>
  )
}
