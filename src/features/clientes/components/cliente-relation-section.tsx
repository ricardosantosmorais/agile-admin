'use client'

import type { ReactNode } from 'react'
import { RelationActions } from '@/src/components/ui/relation-actions'
import { SelectableDataTable, type SelectableDataTableColumn } from '@/src/components/ui/selectable-data-table'
import { SectionCard } from '@/src/components/ui/section-card'

type ClienteRelationSectionProps<TItem> = {
  title: string
  readOnly: boolean
  hasSelection: boolean
  onDelete: () => void
  onCreate: () => void
  items: TItem[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  getRowId: (item: TItem) => string
  emptyMessage: string
  columns: SelectableDataTableColumn<TItem>[]
  action?: ReactNode
}

export function ClienteRelationSection<TItem>({
  title,
  readOnly,
  hasSelection,
  onDelete,
  onCreate,
  items,
  selectedIds,
  onSelectedIdsChange,
  getRowId,
  emptyMessage,
  columns,
  action,
}: ClienteRelationSectionProps<TItem>) {
  return (
    <SectionCard
      title={title}
      className="min-w-0 overflow-hidden"
      action={
        action ??
        (!readOnly ? (
          <RelationActions hasSelection={hasSelection} onDelete={onDelete} onCreate={onCreate} />
        ) : null)
      }
    >
      <SelectableDataTable<TItem>
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={onSelectedIdsChange}
        getRowId={getRowId}
        emptyMessage={emptyMessage}
        columns={columns}
      />
    </SectionCard>
  )
}
