export type HttpClientMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type HttpClientAuthType = 'platform' | 'bearer' | 'basic' | 'none'

export type HttpClientEndpointMode = 'agile' | 'custom'

export type HttpClientBodyType =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'text/plain'
  | 'text/xml'

export type HttpClientKeyValue = {
  key: string
  value: string
}

export type HttpClientRequestDraft = {
  method: HttpClientMethod
  baseUrl: string
  endpointMode: HttpClientEndpointMode
  endpointCatalogValue: string
  endpointCustom: string
  filtersQuery: string
  timeoutSeconds: number
  bodyType: HttpClientBodyType
  authType: HttpClientAuthType
  includeEmpresaHeader: boolean
  bearerToken: string
  basicUser: string
  basicPass: string
  headers: HttpClientKeyValue[]
  queryRows: HttpClientKeyValue[]
  body: string
}

export type HttpClientContext = {
  baseUrl: string
  empresaHeader: string
  tokenMasked: string
  authorizationMasked: string
  endpointCatalog: Array<{
    method: HttpClientMethod
    path: string
    label: string
  }>
}

export type HttpClientResponsePayload = {
  request: {
    url: string
    method: HttpClientMethod
    headers: Record<string, string>
  }
  response: {
    status: number
    durationMs: number
    contentType: string
    headers: Record<string, string>
    body: string
  }
}

export type HttpClientCatalogItem = {
  id: string
  nome: string
  descricao: string
  publico: boolean
  usuario: string
  dthr: string
}

export type HttpClientCatalogItemDetail = {
  id: string
  nome: string
  descricao: string
  publico: boolean
  request: HttpClientRequestDraft
}
