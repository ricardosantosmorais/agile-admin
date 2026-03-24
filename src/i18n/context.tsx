'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { DEFAULT_LOCALE, I18N_COOKIE_KEY, I18N_STORAGE_KEY, resolveLocale } from '@/src/i18n/config'
import type { Locale, TranslationParams } from '@/src/i18n/types'
import { translate } from '@/src/i18n/utils'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string, params?: TranslationParams) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

type I18nProviderProps = PropsWithChildren<{
  initialLocale?: Locale
}>

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') {
      return initialLocale
    }

    return resolveLocale(localStorage.getItem(I18N_STORAGE_KEY))
  })

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(I18N_STORAGE_KEY, locale)
    document.cookie = `${I18N_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`
  }, [locale])

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => setLocaleState(resolveLocale(nextLocale)),
    t: (key, fallback, params) => translate(locale, key, fallback, params),
  }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18nContext() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18nContext precisa ser usado dentro de I18nProvider')
  }

  return context
}
