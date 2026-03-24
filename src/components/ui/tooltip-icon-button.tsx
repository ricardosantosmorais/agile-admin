'use client'

import type { ReactNode } from 'react'

type TooltipIconButtonProps = {
  label: string
  children: ReactNode
}

export function TooltipIconButton({ label, children }: TooltipIconButtonProps) {
  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.45rem)] z-10 hidden -translate-x-1/2 rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
        {label}
      </div>
    </div>
  )
}
