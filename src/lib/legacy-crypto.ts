import { createCipheriv, createDecipheriv } from 'node:crypto'

const LEGACY_ADMIN_CIPHER = 'aes-128-ctr'
const LEGACY_ADMIN_DEFAULT_IV = '9zvEc@qor%rJkCEz'

function toLegacyBuffer(value: string, size: number) {
  const buffer = Buffer.alloc(size)
  Buffer.from(value, 'utf-8').copy(buffer, 0, 0, size)
  return buffer
}

function getLegacyDecryptKey() {
  return process.env.ADMIN_LEGACY_DECRYPT_KEY || ''
}

function getLegacyDecryptIv() {
  return process.env.ADMIN_LEGACY_DECRYPT_IV || LEGACY_ADMIN_DEFAULT_IV
}

export function decryptLegacyAdminValue(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  const keySource = getLegacyDecryptKey()
  if (!keySource) {
    throw new Error('Chave de decrypt legado não configurada no ambiente.')
  }

  const key = toLegacyBuffer(keySource, 16)
  const iv = toLegacyBuffer(getLegacyDecryptIv(), 16)
  const decipher = createDecipheriv(LEGACY_ADMIN_CIPHER, key, iv)

  return decipher.update(normalized, 'base64', 'utf8') + decipher.final('utf8')
}

export function encryptLegacyAdminValue(value: string) {
  const keySource = getLegacyDecryptKey()
  if (!keySource) {
    throw new Error('Chave de encrypt legado não configurada no ambiente.')
  }

  const key = toLegacyBuffer(keySource, 16)
  const iv = toLegacyBuffer(getLegacyDecryptIv(), 16)
  const cipher = createCipheriv(LEGACY_ADMIN_CIPHER, key, iv)

  return cipher.update(value, 'utf8', 'base64') + cipher.final('base64')
}
