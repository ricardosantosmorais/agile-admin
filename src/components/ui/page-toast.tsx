'use client'

import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

type PageToastProps = {
  message: string | null
  tone?: 'success' | 'error'
  onClose: () => void
  durationMs?: number
}

export function PageToast({ message, tone = 'error', onClose, durationMs = 4500 }: PageToastProps) {
  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timeoutId)
  }, [durationMs, message, onClose])

  if (!message) {
    return null
  }

  const isError = tone === 'error'

  return (
    <div className="sticky top-5 z-30">
      <div className={[
        'mx-auto flex max-w-3xl items-start gap-3 rounded-[1.1rem] border px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur',
        isError ? 'border-rose-200 bg-rose-50/95 text-rose-700' : 'border-emerald-200 bg-emerald-50/95 text-emerald-700',
      ].join(' ')}>
        <div className="pt-0.5">
          {isError ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <p className="flex-1 text-sm font-medium leading-6">{message}</p>
        <button type="button" onClick={onClose} className="rounded-full p-1 opacity-70 transition hover:opacity-100" aria-label="Fechar mensagem">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
