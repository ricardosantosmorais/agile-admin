'use client'

import { Loader2, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useI18n } from '@/src/i18n/use-i18n'

type CrudModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  onConfirm: () => void
  isSaving?: boolean
  confirmDisabled?: boolean
}

export function CrudModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  isSaving = false,
  confirmDisabled = false,
}: CrudModalProps) {
  const { t } = useI18n()

  return (
    <OverlayModal open={open} title={title} onClose={onClose}>
      <div className="space-y-4">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-full border border-[#e6dfd3] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSaving || confirmDisabled}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
        </button>
      </div>
    </OverlayModal>
  )
}
