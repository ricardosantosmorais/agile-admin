import type { Locale } from '@/src/i18n/types'

export const I18N_COOKIE_KEY = 'admin-v2-web:locale'
export const I18N_STORAGE_KEY = 'admin-v2-web:locale'

export const DEFAULT_LOCALE: Locale = 'pt-BR'

export const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en-US']

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale))
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE
}
