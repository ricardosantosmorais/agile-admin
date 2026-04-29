'use client'

type DynamicResultGridProps = {
  rows: Record<string, unknown>[]
  emptyMessage: string
  search?: string
  maxColumns?: number
  maxHeightClassName?: string
  cellClassName?: string
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function DynamicResultGrid({
  rows,
  emptyMessage,
  search = '',
  maxColumns = 12,
  maxHeightClassName = 'max-h-[560px]',
  cellClassName = 'max-w-[320px] whitespace-pre-wrap break-words',
}: DynamicResultGridProps) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, maxColumns)
  const normalizedSearch = search.trim().toLowerCase()
  const filteredRows = normalizedSearch
    ? rows.filter((row) => columns.some((column) => stringifyCell(row[column]).toLowerCase().includes(normalizedSearch)))
    : rows

  if (!filteredRows.length || !columns.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line/60 px-4 py-10 text-center text-sm text-[color:var(--app-muted)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`app-table-shell overflow-auto rounded-[1rem] ${maxHeightClassName}`.trim()}>
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="app-table-muted sticky top-0 z-10">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-line/50 px-3 py-3 text-left font-bold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, index) => (
            <tr key={index} className="border-b border-line/40">
              {columns.map((column) => (
                <td key={column} className={`px-3 py-2 text-[color:var(--app-text)] ${cellClassName}`.trim()}>
                  {stringifyCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
