import { asArray, asRecord, asString } from '@/src/lib/api-payload'

type LoginSocialFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export const integracaoLoginSocialParameterKeys = [
  'url_site',
  'g_id_aplicacao',
  'g_senha_aplicacao',
  'fb_id_aplicacao',
  'fb_senha_aplicacao',
] as const

export const integracaoLoginSocialWritableKeys = [
  'g_id_aplicacao',
  'g_senha_aplicacao',
  'fb_id_aplicacao',
  'fb_senha_aplicacao',
] as const

export const integracaoLoginSocialEncryptedKeys = [
  'g_senha_aplicacao',
  'fb_senha_aplicacao',
] as const

export type IntegracaoLoginSocialFieldKey = typeof integracaoLoginSocialParameterKeys[number]
export type IntegracaoLoginSocialWritableKey = typeof integracaoLoginSocialWritableKeys[number]
export type IntegracaoLoginSocialEncryptedKey = typeof integracaoLoginSocialEncryptedKeys[number]
export type IntegracaoLoginSocialValues = Record<IntegracaoLoginSocialFieldKey, string>

export type IntegracaoLoginSocialRecord = {
  values: IntegracaoLoginSocialValues
  metadata: Record<IntegracaoLoginSocialFieldKey, LoginSocialFieldMeta>
}

export type IntegracaoLoginSocialParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: LoginSocialFieldMeta = {
  updatedAt: '',
  updatedBy: '',
}

const encryptedKeySet = new Set<IntegracaoLoginSocialFieldKey>(integracaoLoginSocialEncryptedKeys)

function resolveTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function createEmptyValues(): IntegracaoLoginSocialValues {
  return integracaoLoginSocialParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = ''
    return accumulator
  }, {} as IntegracaoLoginSocialValues)
}

function createEmptyMetadata(): Record<IntegracaoLoginSocialFieldKey, LoginSocialFieldMeta> {
  return integracaoLoginSocialParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = { ...EMPTY_META }
    return accumulator
  }, {} as Record<IntegracaoLoginSocialFieldKey, LoginSocialFieldMeta>)
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): LoginSocialFieldMeta {
  if (!record) {
    return { ...EMPTY_META }
  }

  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoLoginSocialRecord(): IntegracaoLoginSocialRecord {
  return {
    values: createEmptyValues(),
    metadata: createEmptyMetadata(),
  }
}

export function normalizeIntegracaoLoginSocialRecord(payload: unknown): IntegracaoLoginSocialRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))
  const record = createEmptyIntegracaoLoginSocialRecord()

  for (const key of integracaoLoginSocialParameterKeys) {
    const parameter = getParameterByKey(parameters, key)
    record.values[key] = asString(parameter?.parametros).trim()
    record.metadata[key] = extractFieldMeta(parameter)
  }

  return record
}

export function isIntegracaoLoginSocialEncryptedKey(key: IntegracaoLoginSocialFieldKey) {
  return encryptedKeySet.has(key)
}

export function buildIntegracaoLoginSocialRedirectUrl(urlSite: string) {
  const base = urlSite.trim()
  if (!base) {
    return 'components/social-login.php'
  }

  return `${base.replace(/\/?$/, '/')}components/social-login.php`
}

export function buildIntegracaoLoginSocialSavePayload(
  values: IntegracaoLoginSocialValues,
  options?: { includeEncryptedKeys?: IntegracaoLoginSocialEncryptedKey[] },
): IntegracaoLoginSocialParameterPayload[] {
  const includeEncryptedKeys = new Set(options?.includeEncryptedKeys ?? integracaoLoginSocialEncryptedKeys)
  const payload: IntegracaoLoginSocialParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: resolveTimestamp(), integracao: 0, criptografado: 0 },
  ]

  for (const key of integracaoLoginSocialWritableKeys) {
    if (encryptedKeySet.has(key) && !includeEncryptedKeys.has(key as IntegracaoLoginSocialEncryptedKey)) {
      continue
    }

    const value = values[key].trim()
    payload.push({
      id_filial: null,
      chave: key,
      parametros: value,
      integracao: 0,
      criptografado: encryptedKeySet.has(key) && value.length > 0 ? 1 : 0,
    })
  }

  return payload
}
