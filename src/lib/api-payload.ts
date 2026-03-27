export type ApiRecord = Record<string, unknown>

export function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function asNumber<T extends number | undefined = number>(value: unknown, fallback?: T) {
  const parsed = Number(value)
  const effectiveFallback = (arguments.length >= 2 ? fallback : 0) as T extends undefined ? number | undefined : number
  return (Number.isFinite(parsed) ? parsed : effectiveFallback) as T extends undefined ? number | undefined : number
}

export function extractSavedId(payload: unknown) {
  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0]
    if (typeof first === 'object' && first !== null && 'id' in first && typeof first.id === 'string') {
      return first.id
    }
  }

  if (typeof payload === 'object' && payload !== null && 'id' in payload && typeof payload.id === 'string') {
    return payload.id
  }

  return null
}
