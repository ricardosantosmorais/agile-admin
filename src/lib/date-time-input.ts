import { asString } from '@/src/lib/api-payload'

export function formatApiDateTimeToInput(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return ''
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/)
  return match ? `${match[1]}T${match[2]}:${match[3]}` : ''
}

export function formatInputDateTimeToApi(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return null
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/)
  return match ? `${match[1]} ${match[2]}:${match[3]}:00` : null
}

export function formatInputDateTimeForDisplay(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return ''
  }

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : normalized
}
