'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/src/i18n/use-i18n'

type PageHeaderProps = {
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

const segmentFallbacks: Record<string, string> = {
  dashboard: 'Home',
  administradores: 'Administrators',
  clientes: 'Customers',
  configuracoes: 'Settings',
  notificacoes: 'Notifications',
  relatorios: 'Reports',
  geral: 'General',
  novo: 'New',
  editar: 'Edit',
}

function isDynamicSegment(segment: string) {
  return /^\[.+\]$/.test(segment) || /^\d+$/.test(segment)
}

export function PageHeader({ title, actions, breadcrumbs }: PageHeaderProps) {
  const { t } = useI18n()
  const pathname = usePathname() || '/dashboard'
  const segments = pathname.split('/').filter(Boolean)
  const isDashboard = segments.length === 0 || segments[0] === 'dashboard'
  const hasSkippedDynamicSegment = segments.some((segment) => isDynamicSegment(segment))
  function formatSegment(segment: string) {
    return t(`routes.${segment}`, segmentFallbacks[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1))
  }

  const breadcrumbItems = breadcrumbs?.length
    ? breadcrumbs.map((item, index) => ({
        label: item.label,
        href: item.href ?? (index === 0 ? '/dashboard' : pathname),
      }))
    : [{ label: t('routes.dashboard', 'Home'), href: '/dashboard' }]

  if (!breadcrumbs?.length && !isDashboard) {
    let currentPath = ''

    for (const segment of segments) {
      if (isDynamicSegment(segment) || segment === 'dashboard') {
        continue
      }

      currentPath += `/${segment}`
      breadcrumbItems.push({ label: formatSegment(segment), href: currentPath })
    }
  }

  if (!breadcrumbs?.length && title && title !== 'Dashboard' && (breadcrumbItems.length === 1 || hasSkippedDynamicSegment)) {
    breadcrumbItems.push({ label: title, href: pathname })
  }

  return (
    <div className="rounded-[1.45rem] border border-[#ebe6d8] bg-white px-5 py-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] md:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] leading-5">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1

            return (
              <div key={`${item.href}-${item.label}`} className="flex min-w-0 items-center gap-1.5">
                {index > 0 ? <span className="text-slate-300">/</span> : null}
                {isLast ? (
                  <span className="truncate font-semibold text-slate-900">{item.label}</span>
                ) : (
                  <Link href={item.href} className="truncate text-slate-500 transition hover:text-slate-900">
                    {item.label}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
