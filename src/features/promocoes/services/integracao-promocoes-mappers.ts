import { asArray, asRecord, asString } from '@/src/lib/api-payload'

type PromocoesFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export const integracaoPromocoesParameterKeys = [
  'idever_client_id',
  'idever_client_secret',
  'idever_app_id',
  'idever_app_secret',
  'idever_rule_id',
] as const

export const integracaoPromocoesEncryptedKeys = [
  'idever_client_secret',
  'idever_app_secret',
] as const satisfies readonly IntegracaoPromocoesFieldKey[]

export type IntegracaoPromocoesFieldKey = typeof integracaoPromocoesParameterKeys[number]
export type IntegracaoPromocoesEncryptedKey = typeof integracaoPromocoesEncryptedKeys[number]
export type IntegracaoPromocoesValues = Record<IntegracaoPromocoesFieldKey, string>

export type IntegracaoPromocoesRecord = {
  values: IntegracaoPromocoesValues
  metadata: Record<IntegracaoPromocoesFieldKey, PromocoesFieldMeta>
}

export type IntegracaoPromocoesParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: PromocoesFieldMeta = {
  updatedAt: '',
  updatedBy: '',
}

const encryptedKeySet = new Set<IntegracaoPromocoesFieldKey>(integracaoPromocoesEncryptedKeys)

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

function createEmptyValues(): IntegracaoPromocoesValues {
  return integracaoPromocoesParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = ''
    return accumulator
  }, {} as IntegracaoPromocoesValues)
}

function createEmptyMetadata(): Record<IntegracaoPromocoesFieldKey, PromocoesFieldMeta> {
  return integracaoPromocoesParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = { ...EMPTY_META }
    return accumulator
  }, {} as Record<IntegracaoPromocoesFieldKey, PromocoesFieldMeta>)
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): PromocoesFieldMeta {
  if (!record) {
    return { ...EMPTY_META }
  }

  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoPromocoesRecord(): IntegracaoPromocoesRecord {
  return {
    values: createEmptyValues(),
    metadata: createEmptyMetadata(),
  }
}

export function normalizeIntegracaoPromocoesRecord(payload: unknown): IntegracaoPromocoesRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))
  const record = createEmptyIntegracaoPromocoesRecord()

  for (const key of integracaoPromocoesParameterKeys) {
    const parameter = getParameterByKey(parameters, key)
    record.values[key] = asString(parameter?.parametros).trim()
    record.metadata[key] = extractFieldMeta(parameter)
  }

  return record
}

export function isIntegracaoPromocoesEncryptedKey(key: IntegracaoPromocoesFieldKey) {
  return encryptedKeySet.has(key)
}

export function buildIntegracaoPromocoesSavePayload(
  values: IntegracaoPromocoesValues,
  options?: { includeEncryptedKeys?: IntegracaoPromocoesEncryptedKey[] },
): IntegracaoPromocoesParameterPayload[] {
  const includeEncryptedKeys = new Set(options?.includeEncryptedKeys ?? integracaoPromocoesEncryptedKeys)
  const payload: IntegracaoPromocoesParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: resolveTimestamp(), integracao: 0, criptografado: 0 },
  ]

  for (const key of integracaoPromocoesParameterKeys) {
    if (encryptedKeySet.has(key) && !includeEncryptedKeys.has(key as IntegracaoPromocoesEncryptedKey)) {
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
