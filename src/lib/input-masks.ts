export function currencyMask(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(digits) / 100)
}

export function parseCurrencyInput(value: string) {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : null
}

export function decimalMask(value: string, precision = 2) {
  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  const normalized = digits.padStart(precision + 1, '0')
  const integerPart = normalized.slice(0, -precision).replace(/^0+(?=\d)/, '') || '0'
  const decimalPart = normalized.slice(-precision)
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${groupedInteger},${decimalPart}`
}

export function cpfMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function cnpjMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function cpfCnpjMask(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length <= 11 ? cpfMask(digits) : cnpjMask(digits)
}

export function phoneMask(value: string, mobile = false) {
  const digits = value.replace(/\D/g, '').slice(0, mobile ? 11 : 10)
  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : ''
  }
  if (mobile) {
    if (digits.length <= 7) {
      return digits.replace(/^(\d{2})(\d+)/, '($1) $2')
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '')
  }
  if (digits.length <= 6) {
    return digits.replace(/^(\d{2})(\d+)/, '($1) $2')
  }
  return digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '')
}

export function cepMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) {
    return digits
  }
  return digits.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2')
}
