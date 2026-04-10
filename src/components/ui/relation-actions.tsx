'use client'

import { Trash2 } from 'lucide-react'
import { useI18n } from '@/src/i18n/use-i18n'

type RelationActionsProps = {
  hasSelection: boolean
  onDelete: () => void
  onCreate: () => void
  createLabel?: string
}

export function RelationActions({
  hasSelection,
  onDelete,
  onCreate,
  createLabel,
}: RelationActionsProps) {
  const { t } = useI18n()

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={!hasSelection}
        data-state={hasSelection ? 'enabled' : 'disabled'}
        aria-disabled={!hasSelection}
        className="app-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4" />
        {t('common.delete', 'Delete')}
      </button>
      <button
        type="button"
        onClick={onCreate}
        className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
      >
        {createLabel ?? t('common.create', 'Add')}
      </button>
    </div>
  )
}
