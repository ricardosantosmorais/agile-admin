import type { CrudRecord } from '@/src/components/crud-base/types'

export type SharedLookupOption = {
  id: string
  label: string
}

export function toLookupOption(
  value: unknown,
  labelKeys: string[] = ['nome', 'nome_fantasia', 'razao_social'],
  fallbackId?: unknown,
): SharedLookupOption | null {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const id = String(record.id || fallbackId || '').trim()
  if (!id) {
    return null
  }

  const label = labelKeys
    .map((key) => record[key])
    .find((item) => typeof item === 'string' && item.trim().length > 0)

  return {
    id,
    label: String(label || id),
  }
}

export function nullableLookupId(value: unknown) {
  if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = String((value as { id?: unknown }).id || '').trim()
    return id || null
  }

  const normalized = String(value || '').trim()
  return normalized || null
}

export function normalizeLookupState(
  record: CrudRecord,
  idKey: string,
  relationKey: string,
  lookupStateKey: string,
  labelKeys: string[] = ['nome', 'titulo', 'nome_fantasia', 'razao_social'],
) {
  return {
    [lookupStateKey]: toLookupOption(record[relationKey], labelKeys, record[idKey]),
  }
}
