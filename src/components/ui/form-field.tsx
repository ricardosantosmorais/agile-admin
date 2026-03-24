'use client'

import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  children: ReactNode
  className?: string
}

export function FormField({ label, children, className = '' }: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}
