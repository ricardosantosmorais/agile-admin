'use client'

import { createPortal } from 'react-dom'
import { useI18n } from '@/src/i18n/use-i18n'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(15,23,42,0.72)] p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative z-[230] w-full max-w-lg rounded-[1.6rem] border border-[#e6dfd3] bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-3">
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e6dfd3] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            {cancelLabel || t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={[
              'rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50',
              tone === 'danger' ? 'bg-rose-600' : 'bg-slate-950',
            ].join(' ')}
          >
            {confirmLabel || t('common.save', 'Confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
