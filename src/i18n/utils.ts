import { DEFAULT_LOCALE, I18N_STORAGE_KEY, resolveLocale } from '@/src/i18n/config'
import { enUS } from '@/src/i18n/dictionaries/en-US'
import { ptBR } from '@/src/i18n/dictionaries/pt-BR'
import type { Locale, TranslationDictionary, TranslationParams } from '@/src/i18n/types'

const dictionaries: Record<Locale, TranslationDictionary> = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

function getPathValue(dictionary: TranslationDictionary, path: string) {
  return path.split('.').reduce<string | TranslationDictionary | undefined>((current, segment) => {
    if (!current || typeof current === 'string') {
      return undefined
    }

    return current[segment]
  }, dictionary)
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template
  }

  return Object.entries(params).reduce((current, [key, value]) => current.replaceAll(`{{${key}}}`, String(value)), template)
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}

export function getRuntimeLocale() {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  return resolveLocale(window.localStorage.getItem(I18N_STORAGE_KEY))
}

export function translate(locale: Locale, key: string, fallback?: string, params?: TranslationParams) {
  const dictionary = getDictionary(locale)
  const value = getPathValue(dictionary, key)

  if (typeof value === 'string') {
    return interpolate(value, params)
  }

  if (fallback) {
    return interpolate(fallback, params)
  }

  return key
}

export function translateCurrentLocale(key: string, fallback?: string, params?: TranslationParams) {
  return translate(getRuntimeLocale(), key, fallback, params)
}
