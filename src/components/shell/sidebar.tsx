'use client'

import { ChevronDown, Dot, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getMenuItems } from '@/src/components/navigation/menu-items'
import { useTenant } from '@/src/contexts/tenant-context'
import { useUi } from '@/src/contexts/ui-context'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
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

type SidebarNavProps = {
  mobile?: boolean
  isSidebarCollapsed: boolean
  currentTenant: {
    nome: string
    status: string
  }
  menuItems: ReturnType<typeof getMenuItems>
  openGroup: string | null
  pathname: string
  topLevelItemClass: string
  childItemClass: string
  logout: () => Promise<void>
  onCloseMobile: () => void
  onToggleGroup: (key: string) => void
  t: (key: string, fallback?: string) => string
}

function SidebarNav({
  mobile = false,
  isSidebarCollapsed,
  menuItems,
  openGroup,
  pathname,
  topLevelItemClass,
  childItemClass,
  logout,
  onCloseMobile,
  onToggleGroup,
  t,
}: SidebarNavProps) {
  return (
    <>
      <div className={['flex items-center', mobile ? 'justify-between px-1 pb-4' : isSidebarCollapsed ? 'justify-center pb-3' : 'justify-between px-2 pb-4'].join(' ')}>
        <img
          src={mobile || !isSidebarCollapsed ? '/branding/agile-ecommerce-logo.png' : '/branding/agile-ecommerce-logo-pequeno.png'}
          alt="Agile E-commerce"
          className={mobile || !isSidebarCollapsed ? 'h-11 w-auto object-contain' : 'h-11 w-11 object-contain'}
        />

        {mobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="app-button-secondary flex h-10 w-10 items-center justify-center rounded-2xl text-[color:var(--app-muted)]"
            aria-label={t('common.close', 'Fechar')}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className={['space-y-1.5', mobile ? 'mt-0' : isSidebarCollapsed ? 'mt-1' : 'mt-2'].join(' ')}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const hasChildren = Boolean(item.children?.length)
          const groupIsOpen = openGroup === item.key
          const groupHasActiveChild = item.children?.some((child) => isItemActive(pathname, child.to)) ?? false

          if (!hasChildren) {
            const itemClassName = [
              'flex items-center rounded-2xl transition',
              isItemActive(pathname, item.to)
                ? 'app-nav-active text-white'
                : 'app-nav-hover text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]',
              mobile ? 'gap-3 px-3.5 py-3' : isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-3.5 py-2.5',
            ].join(' ')

            if (item.action === 'logout') {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => void logout()}
                  className={itemClassName}
                  title={!mobile && isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {mobile || !isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
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
                  title={!mobile && isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {mobile || !isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
                </a>
              )
            }

            return (
              <Link
                key={item.key}
                href={item.to ?? '/'}
                prefetch={false}
                className={itemClassName}
                title={!mobile && isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {mobile || !isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
              </Link>
            )
          }

          return (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={() => onToggleGroup(item.key)}
                className={[
                  'flex w-full items-center rounded-2xl transition',
                  groupHasActiveChild ? 'app-nav-group-active' : 'app-nav-hover text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]',
                  mobile ? 'justify-between px-3.5 py-3' : isSidebarCollapsed ? 'justify-center py-3' : 'justify-between px-3.5 py-2.5',
                ].join(' ')}
                title={!mobile && isSidebarCollapsed ? item.label : undefined}
              >
                <span className={['flex items-center', mobile || !isSidebarCollapsed ? 'gap-3' : 'justify-center'].join(' ')}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {mobile || !isSidebarCollapsed ? <span className={topLevelItemClass}>{item.label}</span> : null}
                </span>

                {mobile || !isSidebarCollapsed ? (
                  <ChevronDown className={['h-4 w-4 transition-transform', groupIsOpen ? 'rotate-180' : ''].join(' ')} />
                ) : null}
              </button>

              {(mobile || !isSidebarCollapsed) && groupIsOpen ? (
                <div className="space-y-1 pl-3">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon
                    const childClassName = [
                      'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition',
                      isItemActive(pathname, child.to)
                        ? 'app-nav-child-active text-white'
                        : 'app-nav-hover text-slate-500 hover:text-[color:var(--app-text)]',
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
                        prefetch={false}
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
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname() || '/'
  const { session, logout } = useAuth()
  const { currentTenant } = useTenant()
  const { closeMobileSidebar, isMobileSidebarOpen, isSidebarCollapsed } = useUi()
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

  useEffect(() => {
    closeMobileSidebar()
  }, [closeMobileSidebar, pathname])

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileSidebarOpen])

  return (
    <>
      <aside
        className={[
          'app-shell-card-modern hidden min-h-[calc(100vh-1.5rem)] self-start flex-col justify-between rounded-[1.8rem] px-3 py-4 transition-all duration-300 lg:flex',
          isSidebarCollapsed ? 'w-[88px]' : 'w-[270px]',
        ].join(' ')}
      >
        <div className="min-h-0 flex-1">
          <SidebarNav
            isSidebarCollapsed={isSidebarCollapsed}
            currentTenant={currentTenant}
            menuItems={menuItems}
            openGroup={openGroup}
            pathname={pathname}
            topLevelItemClass={topLevelItemClass}
            childItemClass={childItemClass}
            logout={logout}
            onCloseMobile={closeMobileSidebar}
            onToggleGroup={(key) => setOpenGroup((current) => (current === key ? null : key))}
            t={t}
          />
        </div>

        {isSidebarCollapsed ? (
          <div className="flex justify-center pt-2">
            <div
              className="app-control-muted flex h-8 w-8 items-center justify-center rounded-full"
              title={`${currentTenant.nome} · ${currentTenant.status}`}
            >
              <Dot className={['h-7 w-7', getTenantStatusTone(currentTenant.status)].join(' ')} />
            </div>
          </div>
        ) : (
          <div className="app-brand-panel rounded-[1.25rem] px-3.5 py-3 text-[12px] leading-5 text-[color:var(--app-muted)]">
            <p className="font-semibold text-[color:var(--app-text)]">{currentTenant.nome}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Dot className={['h-5 w-5 -ml-1', getTenantStatusTone(currentTenant.status)].join(' ')} />
              <span>{t(`shell.${currentTenant.status.toLowerCase()}`, currentTenant.status)}</span>
            </div>
          </div>
        )}
      </aside>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            aria-label={t('common.close', 'Fechar')}
            onClick={closeMobileSidebar}
          />

          <aside className="app-shell-card-modern absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col rounded-none px-3 py-4 shadow-[0_18px_46px_rgba(15,23,42,0.18)]">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarNav
                mobile
                isSidebarCollapsed={false}
                currentTenant={currentTenant}
                menuItems={menuItems}
                openGroup={openGroup}
                pathname={pathname}
                topLevelItemClass={topLevelItemClass}
                childItemClass={childItemClass}
                logout={logout}
                onCloseMobile={closeMobileSidebar}
                onToggleGroup={(key) => setOpenGroup((current) => (current === key ? null : key))}
                t={t}
              />
            </div>

            <div className="app-brand-panel mt-4 rounded-[1.25rem] px-3.5 py-3 text-[12px] leading-5 text-[color:var(--app-muted)]">
              <p className="font-semibold text-[color:var(--app-text)]">{currentTenant.nome}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Dot className={['h-5 w-5 -ml-1', getTenantStatusTone(currentTenant.status)].join(' ')} />
                <span>{t(`shell.${currentTenant.status.toLowerCase()}`, currentTenant.status)}</span>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
