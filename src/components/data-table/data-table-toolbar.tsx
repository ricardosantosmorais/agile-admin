'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { SlidersHorizontal } from 'lucide-react'

type DataTableToolbarButtonProps = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  href?: string
  tone?: 'primary' | 'secondary' | 'danger'
}

type DataTablePageActionsProps = {
  actions: Array<DataTableToolbarButtonProps | null | false>
}

function getButtonClasses(tone: DataTableToolbarButtonProps['tone']) {
  switch (tone) {
    case 'danger':
      return 'app-button-danger'
    case 'secondary':
      return 'app-button-secondary'
    default:
      return 'app-button-primary'
  }
}

function ToolbarButton({ label, icon: Icon, onClick, href, tone = 'secondary' }: DataTableToolbarButtonProps) {
  const className = `inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${getButtonClasses(tone)}`

  // The datatable toolbar accepts either buttons or links so each list page stays declarative.
  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

export function DataTablePageActions({ actions }: DataTablePageActionsProps) {
  const visibleActions = actions.filter(Boolean) as DataTableToolbarButtonProps[]

  if (!visibleActions.length) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {visibleActions.map((action) => (
        <ToolbarButton key={`${action.label}-${action.href ?? 'button'}`} {...action} />
      ))}
    </div>
  )
}

type DataTableSectionActionProps = {
  label: string
  icon: LucideIcon
  onClick: () => void
}

export function DataTableSectionAction({ label, icon: Icon, onClick }: DataTableSectionActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-button-secondary inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

type DataTableFilterToggleActionProps = {
  expanded: boolean
  onClick: () => void
  collapsedLabel?: string
  expandedLabel?: string
  hint?: string
}

export function DataTableFilterToggleAction({
  expanded,
  onClick,
  collapsedLabel = 'Filtros',
  expandedLabel = 'Ocultar filtros',
  hint = 'Refinar listagem',
}: DataTableFilterToggleActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-button-secondary inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold"
    >
      <SlidersHorizontal className="h-4 w-4" />
      <span>{expanded ? expandedLabel : collapsedLabel}</span>
      <span className="hidden text-[11px] font-medium text-slate-400 lg:inline">{hint}</span>
    </button>
  )
}
