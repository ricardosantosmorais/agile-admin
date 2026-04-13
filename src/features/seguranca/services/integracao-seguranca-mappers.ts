import { asArray, asRecord, asString } from '@/src/lib/api-payload'

export type SegurancaFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type SegurancaValues = {
  recaptchaV3Key: string
  recaptchaV3Secret: string
  recaptchaV2Key: string
  recaptchaV2Secret: string
}

export type SegurancaMetadata = {
  recaptchaV3Key: SegurancaFieldMeta
  recaptchaV3Secret: SegurancaFieldMeta
  recaptchaV2Key: SegurancaFieldMeta
  recaptchaV2Secret: SegurancaFieldMeta
}

export type IntegracaoSegurancaRecord = {
  values: SegurancaValues
  metadata: SegurancaMetadata
  hasV3Secret: boolean
  hasV2Secret: boolean
}

export type SegurancaParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: SegurancaFieldMeta = { updatedAt: '', updatedBy: '' }

const EMPTY_VALUES: SegurancaValues = {
  recaptchaV3Key: '',
  recaptchaV3Secret: '',
  recaptchaV2Key: '',
  recaptchaV2Secret: '',
}

function resolveTimestamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): SegurancaFieldMeta {
  if (!record) return { ...EMPTY_META }
  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoSegurancaRecord(): IntegracaoSegurancaRecord {
  return {
    values: { ...EMPTY_VALUES },
    metadata: {
      recaptchaV3Key: { ...EMPTY_META },
      recaptchaV3Secret: { ...EMPTY_META },
      recaptchaV2Key: { ...EMPTY_META },
      recaptchaV2Secret: { ...EMPTY_META },
    },
    hasV3Secret: false,
    hasV2Secret: false,
  }
}

export function normalizeIntegracaoSegurancaRecord(payload: unknown): IntegracaoSegurancaRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))

  const v3Key = getParameterByKey(parameters, 'recaptcha_v3_key')
  const v3Secret = getParameterByKey(parameters, 'recaptcha_v3_secret')
  const v2Key = getParameterByKey(parameters, 'recaptcha_v2_key')
  const v2Secret = getParameterByKey(parameters, 'recaptcha_v2_secret')

  return {
    values: {
      recaptchaV3Key: asString(v3Key?.parametros).trim(),
      recaptchaV3Secret: asString(v3Secret?.parametros).trim(),
      recaptchaV2Key: asString(v2Key?.parametros).trim(),
      recaptchaV2Secret: asString(v2Secret?.parametros).trim(),
    },
    metadata: {
      recaptchaV3Key: extractFieldMeta(v3Key),
      recaptchaV3Secret: extractFieldMeta(v3Secret),
      recaptchaV2Key: extractFieldMeta(v2Key),
      recaptchaV2Secret: extractFieldMeta(v2Secret),
    },
    hasV3Secret: asString(v3Secret?.parametros).trim().length > 0,
    hasV2Secret: asString(v2Secret?.parametros).trim().length > 0,
  }
}

export type SegurancaSaveOptions = {
  includeV3Key: boolean
  includeV2Key: boolean
  includeV3Secret: boolean
  includeV2Secret: boolean
}

export function buildIntegracaoSegurancaSavePayload(
  values: SegurancaValues,
  options: SegurancaSaveOptions,
): SegurancaParameterPayload[] {
  const version = resolveTimestamp()
  const params: SegurancaParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: version, integracao: 0, criptografado: 0 },
  ]

  if (options.includeV3Key) {
    params.push({ id_filial: null, chave: 'recaptcha_v3_key', parametros: values.recaptchaV3Key.trim(), integracao: 0, criptografado: 0 })
  }

  if (options.includeV2Key) {
    params.push({ id_filial: null, chave: 'recaptcha_v2_key', parametros: values.recaptchaV2Key.trim(), integracao: 0, criptografado: 0 })
  }

  if (options.includeV3Secret) {
    params.push({ id_filial: null, chave: 'recaptcha_v3_secret', parametros: values.recaptchaV3Secret, integracao: 0, criptografado: 1 })
  }

  if (options.includeV2Secret) {
    params.push({ id_filial: null, chave: 'recaptcha_v2_secret', parametros: values.recaptchaV2Secret, integracao: 0, criptografado: 1 })
  }

  return params
}
