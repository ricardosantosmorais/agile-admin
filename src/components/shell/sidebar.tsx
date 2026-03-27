'use client'

import { ChevronDown, Dot } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getMenuItems } from '@/src/components/navigation/menu-items'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useTenant } from '@/src/contexts/tenant-context'
import { useUi } from '@/src/contexts/ui-context'
import { useI18n } from '@/src/i18n/use-i18n'

function isItemActive(pathname: string, to?: string) {
  if (!to) return false
  return pathname === to || pathname.startsWith(`${to}/`)
}

function getTenantStatusTone(status: string) {
  const normalizedStatus = status.toLowerCase()
  if (normalizedStatus === 'operando') return 'text-emerald-500'
  if (normalizedStatus === 'homologacao') return 'text-amber-500'
  return 'text-rose-500'
}

export function Sidebar() {
  const pathname = usePathname() || '/'
  const { session, logout } = useAuth()
  const { currentTenant } = useTenant()
  const { isSidebarCollapsed } = useUi()
  const { locale, t } = useI18n()
  const menuItems = useMemo(() => getMenuItems(session, locale), [locale, session])
  const activeGroup = useMemo(() => (
    menuItems
      .filter((item) => item.children?.some((child) => isItemActive(pathname, child.to)))
      .map((item) => item.key)[0] ?? null
  ), [menuItems, pathname])

  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup)
  const topLevelItemClass = 'text-[15px] font-semibold leading-6 tracking-[-0.01em]'
  const childItemClass = 'text-sm font-semibold leading-6 tracking-[-0.01em]'

  useEffect(() => {
    setOpenGroup(activeGroup)
  }, [activeGroup])

  return (
    <aside
      className={[
        'hidden min-h-[calc(100vh-1.5rem)] self-start flex-col justify-between rounded-[1.8rem] border border-[#ebe6d8] bg-white px-3 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-300 lg:flex',
        isSidebarCollapsed ? 'w-[88px]' : 'w-[270px]',
      ].join(' ')}
    >
      <div className="min-h-0 flex-1">
        <div className={['flex items-center', isSidebarCollapsed ? 'justify-center pb-3' : 'justify-between px-2 pb-4'].join(' ')}>
          <img
            src={isSidebarCollapsed ? '/branding/agile-ecommerce-logo-pequeno.png' : '/branding/agile-ecommerce-logo.png'}
            alt="Agile E-commerce"
            className={isSidebarCollapsed ? 'h-11 w-11 object-contain' : 'h-11 w-auto object-contain'}
          />
        </div>

        <nav className={['space-y-1.5', isSidebarCollapsed ? 'mt-1' : 'mt-2'].join(' ')}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const hasChildren = Boolean(item.children?.length)
            const groupIsOpen = openGroup === item.key
            const groupHasActiveChild = item.children?.some((child) => isItemActive(pathname, child.to)) ?? false

            if (!hasChildren) {
              const itemClassName = [
                'flex items-center rounded-2xl transition',
                isItemActive(pathname, item.to)
                  ? 'bg-accent text-white shadow-[0_10px_24px_rgba(25,95,77,0.18)]'
                  : 'text-slate-600 hover:bg-[#f8f5ee] hover:text-slate-950',
                isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-3.5 py-2.5',
              ].join(' ')

              if (item.action === 'logout') {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => void logout()}
                    className={itemClassName}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
                  </button>
                )
              }

              if (item.external) {
                return (
                  <a
                    key={item.key}
                    href={item.to ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={itemClassName}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
                  </a>
                )
              }

              return (
                <Link
                  key={item.key}
                  href={item.to ?? '/'}
                  className={itemClassName}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
                </Link>
              )
            }

            return (
              <div key={item.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOpenGroup((current) => (current === item.key ? null : item.key))}
                  className={[
                    'flex w-full items-center rounded-2xl transition',
                    groupHasActiveChild ? 'bg-[#edf8f3] text-accent' : 'text-slate-600 hover:bg-[#f8f5ee] hover:text-slate-950',
                    isSidebarCollapsed ? 'justify-center py-3' : 'justify-between px-3.5 py-2.5',
                  ].join(' ')}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <span className={['flex items-center', isSidebarCollapsed ? 'justify-center' : 'gap-3'].join(' ')}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
                  </span>

                  {!isSidebarCollapsed ? (
                    <ChevronDown className={['h-4 w-4 transition-transform', groupIsOpen ? 'rotate-180' : ''].join(' ')} />
                  ) : null}
                </button>

                {!isSidebarCollapsed && groupIsOpen ? (
                  <div className="space-y-1 pl-3">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon
                      const childClassName = [
                        'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition',
                        isItemActive(pathname, child.to)
                          ? 'bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)]'
                          : 'text-slate-500 hover:bg-[#f8f5ee] hover:text-slate-950',
                      ].join(' ')

                      if (child.action === 'logout') {
                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={() => void logout()}
                            className={childClassName}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            <span className={childItemClass}>{child.label}</span>
                          </button>
                        )
                      }

                      if (child.external) {
                        return (
                          <a
                            key={child.key}
                            href={child.to ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className={childClassName}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            <span className={childItemClass}>{child.label}</span>
                          </a>
                        )
                      }

                      return (
                        <Link
                          key={child.key}
                          href={child.to ?? '/'}
                          className={childClassName}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          <span className={childItemClass}>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>

      {isSidebarCollapsed ? (
        <div className="flex justify-center pt-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f8fb]"
            title={`${currentTenant.nome} · ${currentTenant.status}`}
          >
            <Dot className={['h-7 w-7', getTenantStatusTone(currentTenant.status)].join(' ')} />
          </div>
        </div>
      ) : (
        <div className="rounded-[1.25rem] bg-[#faf8f3] px-3.5 py-3 text-[12px] leading-5 text-slate-500">
          <p className="font-semibold text-slate-900">{currentTenant.nome}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Dot className={['h-5 w-5 -ml-1', getTenantStatusTone(currentTenant.status)].join(' ')} />
            <span>{t(`shell.${currentTenant.status.toLowerCase()}`, currentTenant.status)}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
