'use client'

import type { CrudRecord } from '@/src/components/crud-base/types'
import { parseCurrencyInput } from '@/src/lib/input-masks'
import { toLookupOption } from '@/src/lib/lookup-options'
import { normalizeCurrencyInputValue, parseInteger } from '@/src/lib/value-parsers'

export const normalizeCurrency = normalizeCurrencyInputValue
export { parseInteger, toLookupOption }

export function normalizeInteger(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const normalized = String(value).trim()
  return normalized ? normalized.replace(/\D/g, '') : ''
}

export function parseNullableCurrency(value: unknown) {
  return parseCurrencyInput(String(value ?? ''))
}

export function trimNullable(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

export function withLookupRemoved(record: CrudRecord, lookupKeys: string[]) {
  const next = { ...record }
  for (const key of lookupKeys) {
    delete next[key]
  }
  return next
}
