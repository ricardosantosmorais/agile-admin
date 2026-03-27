export function isValidEmail(value: string) {
  if (!value.trim()) {
    return true
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export type PasswordRules = {
  length: boolean
  uppercase: boolean
  number: boolean
  special: boolean
}

export function getStrongPasswordRules(value: string): PasswordRules {
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[!@#$%^&*()[\]{}<>?\-_=+]/.test(value),
  }
}

export function isStrongPassword(value: string) {
  const rules = getStrongPasswordRules(value)
  return rules.length && rules.uppercase && rules.number && rules.special
}

export function validateCepLength(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits && digits.length !== 8) {
    return 'common.validZipCode'
  }

  return null
}
