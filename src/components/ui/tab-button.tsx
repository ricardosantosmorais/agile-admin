'use client'

import type { ReactNode } from 'react'

type TabButtonProps = {
  active: boolean
  label: string
  icon?: ReactNode
  onClick: () => void
}

export function TabButton({ active, label, icon, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
        active ? 'app-pill-tab-active' : 'app-pill-tab',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
