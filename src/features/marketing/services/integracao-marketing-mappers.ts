import { asArray, asRecord, asString } from '@/src/lib/api-payload'

type MarketingFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export const integracaoMarketingParameterKeys = [
  'ga3',
  'ga4',
  'ga4_ios',
  'ga4_android',
  'gtm',
  'ga_conversion',
  'ga_conversion_cadastro',
  'gverify',
  'versao_datalayer',
  'fb_pixel',
  'fb_token',
  'fb_verify',
  'rd_ecom_client_id',
  'rd_ecom_client_secret',
  'rd_ecom_refresh_token',
  'rd_ecom_checkout_started',
  'rd_ecom_cart_abandoned',
  'rd_ecom_order_placed',
  'rd_ecom_order_paid',
  'rd_ecom_order_canceled',
  'rd_ecom_order_refunded',
  'rd_ecom_order_fulfilled',
  'rd_ecom_shipment_delivered',
  'rd_js',
  'rd_client_id',
  'rd_client_secret',
  'rd_code',
  'rd_refresh_token',
  'rd_ativacao',
  'rd_cliente',
  'rd_contato',
  'rd_newsletter',
  'rd_carrinho',
  'rd_pedido',
  'egoi_js',
  'egoi_id',
  'egoi_api_key',
  'egoi_domain',
  'egoi_lista_id',
  'egoi_ativacao',
  'egoi_cliente',
  'egoi_contato',
  'egoi_newsletter',
  'egoi_carrinho',
  'egoi_pedido',
  'hotjar_id',
] as const

export type IntegracaoMarketingFieldKey = typeof integracaoMarketingParameterKeys[number]
export type IntegracaoMarketingValues = Record<IntegracaoMarketingFieldKey, string>

export type IntegracaoMarketingRecord = {
  values: IntegracaoMarketingValues
  metadata: Record<IntegracaoMarketingFieldKey, MarketingFieldMeta>
}

export type IntegracaoMarketingParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

export const integracaoMarketingEncryptedKeys = [
  'fb_token',
  'rd_client_secret',
  'rd_refresh_token',
  'rd_ecom_client_secret',
  'rd_ecom_refresh_token',
  'egoi_api_key',
] as const satisfies readonly IntegracaoMarketingFieldKey[]

export const integracaoMarketingBooleanKeys = [
  'rd_ecom_checkout_started',
  'rd_ecom_cart_abandoned',
  'rd_ecom_order_placed',
  'rd_ecom_order_paid',
  'rd_ecom_order_canceled',
  'rd_ecom_order_refunded',
  'rd_ecom_order_fulfilled',
  'rd_ecom_shipment_delivered',
  'rd_ativacao',
  'rd_cliente',
  'rd_contato',
  'rd_newsletter',
  'rd_carrinho',
  'rd_pedido',
  'egoi_ativacao',
  'egoi_cliente',
  'egoi_contato',
  'egoi_newsletter',
  'egoi_carrinho',
  'egoi_pedido',
] as const satisfies readonly IntegracaoMarketingFieldKey[]

export const integracaoMarketingRdEcomEventKeys = [
  'rd_ecom_checkout_started',
  'rd_ecom_cart_abandoned',
  'rd_ecom_order_placed',
  'rd_ecom_order_paid',
  'rd_ecom_order_canceled',
  'rd_ecom_order_refunded',
  'rd_ecom_order_fulfilled',
  'rd_ecom_shipment_delivered',
] as const satisfies readonly IntegracaoMarketingFieldKey[]

const EMPTY_META: MarketingFieldMeta = {
  updatedAt: '',
  updatedBy: '',
}

const encryptedKeySet = new Set<IntegracaoMarketingFieldKey>(integracaoMarketingEncryptedKeys)
const booleanKeySet = new Set<IntegracaoMarketingFieldKey>(integracaoMarketingBooleanKeys)

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

function createEmptyValues(): IntegracaoMarketingValues {
  return integracaoMarketingParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = booleanKeySet.has(key) ? 'false' : ''
    return accumulator
  }, {} as IntegracaoMarketingValues)
}

function createEmptyMetadata(): Record<IntegracaoMarketingFieldKey, MarketingFieldMeta> {
  return integracaoMarketingParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = { ...EMPTY_META }
    return accumulator
  }, {} as Record<IntegracaoMarketingFieldKey, MarketingFieldMeta>)
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string) {
  return parameters.find((item) => asString(item.chave).trim() === key && asString(item.id_filial).trim().length === 0) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): MarketingFieldMeta {
  if (!record) {
    return { ...EMPTY_META }
  }

  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoMarketingRecord(): IntegracaoMarketingRecord {
  return {
    values: createEmptyValues(),
    metadata: createEmptyMetadata(),
  }
}

export function normalizeIntegracaoMarketingRecord(payload: unknown): IntegracaoMarketingRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))
  const record = createEmptyIntegracaoMarketingRecord()

  for (const key of integracaoMarketingParameterKeys) {
    const parameter = getParameterByKey(parameters, key)
    const value = asString(parameter?.parametros).trim()
    record.values[key] = booleanKeySet.has(key) ? (value === 'true' ? 'true' : 'false') : value
    record.metadata[key] = extractFieldMeta(parameter)
  }

  if (!record.values.versao_datalayer) {
    record.values.versao_datalayer = 'GA4'
  }

  return record
}

export function isIntegracaoMarketingEncryptedKey(key: IntegracaoMarketingFieldKey) {
  return encryptedKeySet.has(key)
}

export function hasIntegracaoMarketingRdEcomEvents(values: IntegracaoMarketingValues) {
  return integracaoMarketingRdEcomEventKeys.some((key) => values[key] === 'true')
}

export function buildIntegracaoMarketingSavePayload(
  values: IntegracaoMarketingValues,
  options?: { includeEncryptedKeys?: IntegracaoMarketingFieldKey[] },
): IntegracaoMarketingParameterPayload[] {
  const includeEncryptedKeys = new Set(options?.includeEncryptedKeys ?? integracaoMarketingEncryptedKeys)
  const payload: IntegracaoMarketingParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: resolveTimestamp(), integracao: 0, criptografado: 0 },
  ]

  for (const key of integracaoMarketingParameterKeys) {
    if (encryptedKeySet.has(key) && !includeEncryptedKeys.has(key)) {
      continue
    }

    const value = booleanKeySet.has(key) ? (values[key] === 'true' ? 'true' : 'false') : values[key].trim()
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
