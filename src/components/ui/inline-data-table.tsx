'use client'

import type { ReactNode } from 'react'
import { EmptyTableRow } from '@/src/components/ui/empty-table-row'

export type InlineDataTableColumn<TItem> = {
  id: string
  header: ReactNode
  cell: (item: TItem, index: number) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

type InlineDataTableProps<TItem> = {
  rows: TItem[]
  getRowId: (item: TItem, index: number) => string
  columns: Array<InlineDataTableColumn<TItem>>
  emptyMessage: string
  minWidthClassName?: string
  rowClassName?: string | ((item: TItem, index: number) => string)
}

export function InlineDataTable<TItem>({
  rows,
  getRowId,
  columns,
  emptyMessage,
  minWidthClassName = 'min-w-full',
  rowClassName,
}: InlineDataTableProps<TItem>) {
  function resolveRowClassName(item: TItem, index: number) {
    const customClassName = typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName
    return ['app-table-row-hover border-t border-line/60 align-top', customClassName].filter(Boolean).join(' ')
  }

  return (
    <div className="app-table-shell overflow-x-auto rounded-[1.1rem]">
      <table className={`${minWidthClassName} border-collapse text-left text-sm`}>
        <thead className="app-table-muted text-xs font-black uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className={`px-4 py-3 font-semibold ${column.headerClassName ?? ''}`.trim()}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[color:var(--app-card-bg)]">
          {rows.length ? (
            rows.map((item, index) => {
              const rowId = getRowId(item, index)
              return (
                <tr key={rowId} className={resolveRowClassName(item, index)}>
                  {columns.map((column) => (
                    <td
                      key={`${rowId}-${column.id}`}
                      className={`px-4 py-4 align-middle ${column.cellClassName ?? ''}`.trim()}
                    >
                      {column.cell(item, index)}
                    </td>
                  ))}
                </tr>
              )
            })
          ) : (
            <EmptyTableRow colSpan={columns.length} message={emptyMessage} />
          )}
        </tbody>
      </table>
    </div>
  )
}
