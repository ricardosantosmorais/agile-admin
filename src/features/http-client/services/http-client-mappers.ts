import type {
  HttpClientBodyType,
  HttpClientMethod,
  HttpClientRequestDraft,
} from '@/src/features/http-client/services/http-client-types'

const HTTP_METHODS: HttpClientMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const BODY_TYPES: HttpClientBodyType[] = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'text/xml']

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return fallback
}

function normalizeMethod(value: unknown): HttpClientMethod {
  const method = asString(value).toUpperCase() as HttpClientMethod
  return HTTP_METHODS.includes(method) ? method : 'GET'
}

function normalizeBodyType(value: unknown): HttpClientBodyType {
  const bodyType = asString(value) as HttpClientBodyType
  return BODY_TYPES.includes(bodyType) ? bodyType : 'application/json'
}

function normalizeRows(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const row = asRecord(item)
      return {
        key: asString(row.key),
        value: asString(row.value),
      }
    })
    .filter((item) => item.key.trim() !== '')
}

export function createDefaultHttpClientRequest(baseUrl = ''): HttpClientRequestDraft {
  return {
    method: 'GET',
    baseUrl,
    endpointMode: 'agile',
    endpointCatalogValue: '',
    endpointCustom: '',
    filtersQuery: '',
    timeoutSeconds: 60,
    bodyType: 'application/json',
    authType: 'platform',
    includeEmpresaHeader: true,
    bearerToken: '',
    basicUser: '',
    basicPass: '',
    headers: [{ key: 'Accept', value: 'application/json' }],
    queryRows: [{ key: '', value: '' }],
    body: '',
  }
}

export function normalizeHttpClientDraft(value: unknown): HttpClientRequestDraft {
  const source = asRecord(value)
  const headers = normalizeRows(source.headers)
  const queryRows = normalizeRows(source.queryRows)
  return {
    method: normalizeMethod(source.method),
    baseUrl: asString(source.baseUrl),
    endpointMode: asString(source.endpointMode) === 'custom' ? 'custom' : 'agile',
    endpointCatalogValue: asString(source.endpointCatalogValue),
    endpointCustom: asString(source.endpointCustom),
    filtersQuery: asString(source.filtersQuery),
    timeoutSeconds: Math.min(300, Math.max(1, Number(source.timeoutSeconds || 60) || 60)),
    bodyType: normalizeBodyType(source.bodyType),
    authType: ['platform', 'bearer', 'basic', 'none'].includes(asString(source.authType)) ? (asString(source.authType) as HttpClientRequestDraft['authType']) : 'platform',
    includeEmpresaHeader: toBoolean(source.includeEmpresaHeader, true),
    bearerToken: asString(source.bearerToken),
    basicUser: asString(source.basicUser),
    basicPass: asString(source.basicPass),
    headers: headers.length ? headers : [{ key: 'Accept', value: 'application/json' }],
    queryRows: queryRows.length ? queryRows : [{ key: '', value: '' }],
    body: asString(source.body),
  }
}
