'use client'

import type { ReactNode } from 'react'
import { EmptyTableRow } from '@/src/components/ui/empty-table-row'

export type SelectableDataTableColumn<TItem> = {
  header: string
  render: (item: TItem) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

type SelectableDataTableProps<TItem> = {
  items: TItem[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  getRowId: (item: TItem) => string
  columns: Array<SelectableDataTableColumn<TItem>>
  emptyMessage: string
}

export function SelectableDataTable<TItem>({
  items,
  selectedIds,
  onSelectedIdsChange,
  getRowId,
  columns,
  emptyMessage,
}: SelectableDataTableProps<TItem>) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(getRowId(item)))

  function toggleAll(checked: boolean) {
    onSelectedIdsChange(checked ? items.map(getRowId) : [])
  }

  function toggleOne(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((currentId) => currentId !== id) : [...selectedIds, id],
    )
  }

  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-[#ebe4d8]">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-[#f8f4ec] text-slate-700">
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
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item) => {
              const rowId = getRowId(item)
              return (
                <tr key={rowId} className="border-t border-[#f0ebe2]">
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
                </tr>
              )
            })
          ) : (
            <EmptyTableRow colSpan={columns.length + 1} message={emptyMessage} />
          )}
        </tbody>
      </table>
    </div>
  )
}
