'use client'

import { ChevronsUpDown } from 'lucide-react'

type SortableHeaderProps<TColumn extends string> = {
  label: string
  column: TColumn
  activeColumn: TColumn
  direction: 'asc' | 'desc'
  onToggle: (column: TColumn) => void
}

export function SortableHeader<TColumn extends string>({
  label,
  column,
  activeColumn,
  direction,
  onToggle,
}: SortableHeaderProps<TColumn>) {
  const active = activeColumn === column

  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className="inline-flex items-center gap-2 text-left font-semibold text-slate-700 transition hover:text-slate-950"
    >
      <span>{label}</span>
      {active ? (
        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {direction === 'asc' ? 'ASC' : 'DESC'}
        </span>
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
      )}
    </button>
  )
}
