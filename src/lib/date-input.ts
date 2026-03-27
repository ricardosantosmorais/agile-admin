import { asString } from '@/src/lib/api-payload'

export function formatApiDateToInput(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return ''
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

export function formatInputDateToApiStart(value: unknown) {
  const normalized = asString(value).trim()
  return normalized ? `${normalized} 00:00:00` : null
}

export function formatInputDateToApiEnd(value: unknown) {
  const normalized = asString(value).trim()
  return normalized ? `${normalized} 23:59:59` : null
}
