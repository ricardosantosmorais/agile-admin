import type { ReactNode } from 'react'

type StatusBadgeProps = {
  children: ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
}

const tones = {
  success: 'app-badge app-badge-success',
  warning: 'app-badge app-badge-warning',
  danger: 'app-badge app-badge-danger',
  neutral: 'app-badge app-badge-neutral',
  info: 'app-badge app-badge-info',
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  )
}
