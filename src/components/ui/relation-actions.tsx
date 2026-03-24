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
        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <Trash2 className="h-4 w-4" />
        {t('common.delete', 'Delete')}
      </button>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
      >
        {createLabel ?? t('common.create', 'Add')}
      </button>
    </div>
  )
}
