export type Locale = 'pt-BR' | 'en-US'

export type TranslationPrimitive = string | number

export type TranslationParams = Record<string, TranslationPrimitive>

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary
}
