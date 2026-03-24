'use client'

import type { ReactNode } from 'react'

type FormRowProps = {
  label: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function FormRow({ label, children, className = '', contentClassName = '' }: FormRowProps) {
  return (
    <div className={['grid items-start gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8', className].join(' ').trim()}>
      <div className="pt-2.5 text-[13px] font-medium text-slate-700">{label}</div>
      <div className={['min-w-0', contentClassName].join(' ').trim()}>{children}</div>
    </div>
  )
}
