import { parseLocalizedNumber } from '@/src/lib/value-parsers'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNullableCurrency(value: number | string | null | undefined, fallback = '-') {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }

  return formatCurrency(numeric)
}

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')} mi`
  }

  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)} mil`
  }

  return formatCurrency(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

export function formatLocalizedCurrency(value: unknown, fallback = '-') {
  const numeric = typeof value === 'number' ? value : parseLocalizedNumber(value)
  if (numeric === null || !Number.isFinite(numeric)) {
    return fallback
  }

  return formatCurrency(numeric)
}

export function formatLocalizedPercent(value: unknown, fallback = '-') {
  const numeric = typeof value === 'number' ? value : parseLocalizedNumber(value)
  if (numeric === null || !Number.isFinite(numeric)) {
    return fallback
  }

  return formatPercent(numeric)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function formatCpfCnpj(value: unknown, fallback = '-') {
  const raw = String(value ?? '').trim()
  const digits = raw.replace(/\D/g, '')

  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }

  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  return raw || fallback
}
