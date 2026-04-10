'use client'

import { createPortal } from 'react-dom'
import { useI18n } from '@/src/i18n/use-i18n'
import { useDialogA11y } from '@/src/components/ui/dialog-a11y'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onClose?: () => void
  onCancel?: () => void
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
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n()
  const handleClose = onCancel ?? onClose ?? (() => undefined)
  const { dialogRef, titleId, descriptionId } = useDialogA11y({ open, onClose: handleClose })

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="app-shell-card-modern relative z-[230] w-full max-w-lg rounded-[1.6rem] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-3">
          <h2 id={titleId} className="text-lg font-black tracking-tight text-[color:var(--app-text)]">{title}</h2>
          <p id={descriptionId} className="text-sm leading-6 text-[color:var(--app-muted)]">{description}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_8px_16px_rgba(15,23,42,0.05)]"
          >
            {cancelLabel || t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={[
              'rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_22px_rgba(15,23,42,0.16)] disabled:opacity-50',
              tone === 'danger' ? 'bg-rose-600' : 'app-button-primary',
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
