export function digitsOnly(value: unknown) {
  return String(value ?? '').replace(/\D/g, '')
}

export function splitPhone(value: unknown) {
  const digits = digitsOnly(value)
  if (!digits) {
    return { ddd: '', number: '' }
  }

  return {
    ddd: digits.slice(0, 2),
    number: digits.slice(2),
  }
}

export function parseLocalizedNumber(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }

  const hasComma = raw.includes(',')
  const hasDot = raw.includes('.')
  const normalized = hasComma && hasDot
    ? raw.replace(/\./g, '').replace(',', '.')
    : hasComma
      ? raw.replace(',', '.')
      : raw

  const parsed = Number(normalized.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function formatLocalizedDecimal(value: unknown, precision = 2) {
  const parsed = typeof value === 'number' ? value : parseLocalizedNumber(value)
  if (parsed === null || !Number.isFinite(parsed)) {
    return ''
  }

  return parsed.toLocaleString('pt-BR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

export function parseInteger(value: unknown) {
  const normalized = digitsOnly(value)
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeInteger(value: unknown) {
  return digitsOnly(value)
}

export function normalizeCurrencyInputValue(value: unknown) {
  return formatLocalizedDecimal(value, 2)
}
