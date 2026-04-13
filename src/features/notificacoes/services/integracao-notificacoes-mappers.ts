import { asArray, asRecord, asString } from '@/src/lib/api-payload'

export type NotificacoesFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type NotificacoesValues = {
  fcmPrivateKey: string
  fcmCodigo: string
  fcmSenderId: string
  fcmWebPrivateKey: string
  fcmWebApiKey: string
  fcmWebCodigo: string
  fcmWebAppId: string
  fcmWebSenderId: string
  fcmWebVapidKey: string
}

export type NotificacoesMetadata = {
  fcmPrivateKey: NotificacoesFieldMeta
  fcmCodigo: NotificacoesFieldMeta
  fcmSenderId: NotificacoesFieldMeta
  fcmWebPrivateKey: NotificacoesFieldMeta
  fcmWebApiKey: NotificacoesFieldMeta
  fcmWebCodigo: NotificacoesFieldMeta
  fcmWebAppId: NotificacoesFieldMeta
  fcmWebSenderId: NotificacoesFieldMeta
  fcmWebVapidKey: NotificacoesFieldMeta
}

export type IntegracaoNotificacoesRecord = {
  values: NotificacoesValues
  metadata: NotificacoesMetadata
}

export type NotificacoesParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: NotificacoesFieldMeta = { updatedAt: '', updatedBy: '' }

const EMPTY_VALUES: NotificacoesValues = {
  fcmPrivateKey: '',
  fcmCodigo: '',
  fcmSenderId: '',
  fcmWebPrivateKey: '',
  fcmWebApiKey: '',
  fcmWebCodigo: '',
  fcmWebAppId: '',
  fcmWebSenderId: '',
  fcmWebVapidKey: '',
}

function resolveTimestamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): NotificacoesFieldMeta {
  if (!record) return { ...EMPTY_META }
  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoNotificacoesRecord(): IntegracaoNotificacoesRecord {
  return {
    values: { ...EMPTY_VALUES },
    metadata: {
      fcmPrivateKey: { ...EMPTY_META },
      fcmCodigo: { ...EMPTY_META },
      fcmSenderId: { ...EMPTY_META },
      fcmWebPrivateKey: { ...EMPTY_META },
      fcmWebApiKey: { ...EMPTY_META },
      fcmWebCodigo: { ...EMPTY_META },
      fcmWebAppId: { ...EMPTY_META },
      fcmWebSenderId: { ...EMPTY_META },
      fcmWebVapidKey: { ...EMPTY_META },
    },
  }
}

export function normalizeIntegracaoNotificacoesRecord(payload: unknown): IntegracaoNotificacoesRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))

  const fcmPrivateKey = getParameterByKey(parameters, 'fcm_private_key')
  const fcmCodigo = getParameterByKey(parameters, 'fcm_codigo')
  const fcmSenderId = getParameterByKey(parameters, 'fcm_sender_id')
  const fcmWebPrivateKey = getParameterByKey(parameters, 'fcm_web_private_key')
  const fcmWebApiKey = getParameterByKey(parameters, 'fcm_web_api_key')
  const fcmWebCodigo = getParameterByKey(parameters, 'fcm_web_codigo')
  const fcmWebAppId = getParameterByKey(parameters, 'fcm_web_app_id')
  const fcmWebSenderId = getParameterByKey(parameters, 'fcm_web_sender_id')
  const fcmWebVapidKey = getParameterByKey(parameters, 'fcm_web_vapid_key')

  return {
    values: {
      fcmPrivateKey: asString(fcmPrivateKey?.parametros).trim(),
      fcmCodigo: asString(fcmCodigo?.parametros).trim(),
      fcmSenderId: asString(fcmSenderId?.parametros).trim(),
      fcmWebPrivateKey: asString(fcmWebPrivateKey?.parametros).trim(),
      fcmWebApiKey: asString(fcmWebApiKey?.parametros).trim(),
      fcmWebCodigo: asString(fcmWebCodigo?.parametros).trim(),
      fcmWebAppId: asString(fcmWebAppId?.parametros).trim(),
      fcmWebSenderId: asString(fcmWebSenderId?.parametros).trim(),
      fcmWebVapidKey: asString(fcmWebVapidKey?.parametros).trim(),
    },
    metadata: {
      fcmPrivateKey: extractFieldMeta(fcmPrivateKey),
      fcmCodigo: extractFieldMeta(fcmCodigo),
      fcmSenderId: extractFieldMeta(fcmSenderId),
      fcmWebPrivateKey: extractFieldMeta(fcmWebPrivateKey),
      fcmWebApiKey: extractFieldMeta(fcmWebApiKey),
      fcmWebCodigo: extractFieldMeta(fcmWebCodigo),
      fcmWebAppId: extractFieldMeta(fcmWebAppId),
      fcmWebSenderId: extractFieldMeta(fcmWebSenderId),
      fcmWebVapidKey: extractFieldMeta(fcmWebVapidKey),
    },
  }
}

export function buildIntegracaoNotificacoesSavePayload(
  values: NotificacoesValues,
): NotificacoesParameterPayload[] {
  const version = resolveTimestamp()
  return [
    { id_filial: null, chave: 'versao', parametros: version, integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_private_key', parametros: values.fcmPrivateKey.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_codigo', parametros: values.fcmCodigo.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_sender_id', parametros: values.fcmSenderId.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_web_private_key', parametros: values.fcmWebPrivateKey.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_web_api_key', parametros: values.fcmWebApiKey.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_web_codigo', parametros: values.fcmWebCodigo.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_web_app_id', parametros: values.fcmWebAppId.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_web_sender_id', parametros: values.fcmWebSenderId.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'fcm_web_vapid_key', parametros: values.fcmWebVapidKey.trim(), integracao: 0, criptografado: 0 },
  ]
}
