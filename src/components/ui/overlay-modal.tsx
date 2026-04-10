'use client'

import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useDialogA11y } from '@/src/components/ui/dialog-a11y'

type OverlayModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  maxWidthClassName?: string
  headerActions?: ReactNode
  headerClassName?: string
  bodyClassName?: string
  bodyScrollable?: boolean
}

export function OverlayModal({
  open,
  title,
  children,
  onClose,
  maxWidthClassName = 'max-w-3xl',
  headerActions,
  headerClassName = '',
  bodyClassName = '',
  bodyScrollable = true,
}: OverlayModalProps) {
  const { dialogRef, titleId } = useDialogA11y({ open, onClose })

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`app-shell-card-modern relative z-[210] flex max-h-[calc(100vh-2rem)] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-[1.6rem] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.28)]`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`mb-5 flex items-center justify-between gap-4 ${headerClassName}`.trim()}>
          <h2 id={titleId} className="text-lg font-black tracking-tight text-[color:var(--app-text)]">{title}</h2>
          <div className="flex items-center gap-3">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
              data-dialog-close="true"
              className="app-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--app-muted)] shadow-[0_8px_16px_rgba(15,23,42,0.05)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          data-dialog-body="true"
          className={`min-h-0 flex-1 ${bodyScrollable ? 'overflow-y-auto pr-1' : 'overflow-hidden'} ${bodyClassName}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
