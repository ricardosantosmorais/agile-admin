import { asArray, asRecord, asString } from '@/src/lib/api-payload'

export type ScriptsFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ScriptsValues = {
  headJs: string
  footerJs: string
}

export type ScriptsMetadata = {
  headJs: ScriptsFieldMeta
  footerJs: ScriptsFieldMeta
}

export type IntegracaoScriptsRecord = {
  values: ScriptsValues
  metadata: ScriptsMetadata
}

export type ScriptsParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: ScriptsFieldMeta = { updatedAt: '', updatedBy: '' }

const EMPTY_VALUES: ScriptsValues = {
  headJs: '',
  footerJs: '',
}

function resolveTimestamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): ScriptsFieldMeta {
  if (!record) return { ...EMPTY_META }
  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoScriptsRecord(): IntegracaoScriptsRecord {
  return {
    values: { ...EMPTY_VALUES },
    metadata: {
      headJs: { ...EMPTY_META },
      footerJs: { ...EMPTY_META },
    },
  }
}

export function normalizeIntegracaoScriptsRecord(payload: unknown): IntegracaoScriptsRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))

  const headJs = getParameterByKey(parameters, 'head_js')
  const footerJs = getParameterByKey(parameters, 'footer_js')

  return {
    values: {
      headJs: asString(headJs?.parametros).trim(),
      footerJs: asString(footerJs?.parametros).trim(),
    },
    metadata: {
      headJs: extractFieldMeta(headJs),
      footerJs: extractFieldMeta(footerJs),
    },
  }
}

export function buildIntegracaoScriptsSavePayload(
  values: ScriptsValues,
): ScriptsParameterPayload[] {
  const version = resolveTimestamp()
  return [
    { id_filial: null, chave: 'versao', parametros: version, integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'head_js', parametros: values.headJs, integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'footer_js', parametros: values.footerJs, integracao: 0, criptografado: 0 },
  ]
}
