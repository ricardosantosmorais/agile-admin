'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

type ThemeMode = 'light' | 'dark'

type UiContextValue = {
  isSidebarCollapsed: boolean
  theme: ThemeMode
  toggleSidebar: () => void
  toggleTheme: () => void
}

const SIDEBAR_STORAGE_KEY = 'admin-v2-web:ui:sidebar-collapsed'
const THEME_STORAGE_KEY = 'admin-v2-web:ui:theme'

const UiContext = createContext<UiContextValue | undefined>(undefined)

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return 'light'
}

export function UiProvider({ children }: PropsWithChildren) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const value = useMemo(() => ({
    isSidebarCollapsed,
    theme,
    toggleSidebar: () => setIsSidebarCollapsed((current) => !current),
    toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
  }), [isSidebarCollapsed, theme])

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi precisa ser usado dentro de UiProvider')
  return context
}
