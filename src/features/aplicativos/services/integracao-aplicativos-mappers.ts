import { asArray, asRecord, asString } from '@/src/lib/api-payload'

export type AplicativosFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type AplicativosValues = {
  androidLink: string
  iosLink: string
}

export type AplicativosMetadata = {
  androidLink: AplicativosFieldMeta
  iosLink: AplicativosFieldMeta
}

export type IntegracaoAplicativosRecord = {
  values: AplicativosValues
  metadata: AplicativosMetadata
}

export type AplicativosParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: AplicativosFieldMeta = { updatedAt: '', updatedBy: '' }

const EMPTY_VALUES: AplicativosValues = {
  androidLink: '',
  iosLink: '',
}

function resolveTimestamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): AplicativosFieldMeta {
  if (!record) return { ...EMPTY_META }
  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoAplicativosRecord(): IntegracaoAplicativosRecord {
  return {
    values: { ...EMPTY_VALUES },
    metadata: {
      androidLink: { ...EMPTY_META },
      iosLink: { ...EMPTY_META },
    },
  }
}

export function normalizeIntegracaoAplicativosRecord(payload: unknown): IntegracaoAplicativosRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))

  const androidLink = getParameterByKey(parameters, 'android_link')
  const iosLink = getParameterByKey(parameters, 'ios_link')

  return {
    values: {
      androidLink: asString(androidLink?.parametros).trim(),
      iosLink: asString(iosLink?.parametros).trim(),
    },
    metadata: {
      androidLink: extractFieldMeta(androidLink),
      iosLink: extractFieldMeta(iosLink),
    },
  }
}

export function buildIntegracaoAplicativosSavePayload(
  values: AplicativosValues,
): AplicativosParameterPayload[] {
  const version = resolveTimestamp()
  return [
    { id_filial: null, chave: 'versao', parametros: version, integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'android_link', parametros: values.androidLink.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'ios_link', parametros: values.iosLink.trim(), integracao: 0, criptografado: 0 },
  ]
}
