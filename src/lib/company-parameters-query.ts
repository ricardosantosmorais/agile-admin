type LookupPathOptions = {
  fields?: string[]
  order: string
  perPage?: number
  includeActiveOnly?: boolean
  extraParams?: Record<string, string>
}

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

function escapeApiQueryValue(value: string) {
  return value.replace(/'/g, "\\'")
}

export function buildApiInQuery(field: string, values: string[]) {
  const normalizedValues = [...new Set(values.map((value) => String(value).trim()).filter(Boolean))]
  return `${field} in('${normalizedValues.map(escapeApiQueryValue).join("','")}')`
}

export function buildCompanyParametersPath(tenantId: string, parameterKeys: string[]) {
  const params = new URLSearchParams({
    id_empresa: tenantId,
    order: 'chave,posicao',
    perpage: '1000',
  })

  const normalizedKeys = [...new Set(parameterKeys.map((key) => String(key).trim()).filter(Boolean))]
  if (normalizedKeys.length) {
    params.set('q', buildApiInQuery('chave', normalizedKeys))
  }

  return `empresas/parametros?${params.toString()}`
}

export function buildLookupPath(resource: string, tenantId: string, options: LookupPathOptions) {
  const params = new URLSearchParams({
    id_empresa: tenantId,
    order: options.order,
    perpage: String(options.perPage ?? 1000),
    ...(options.includeActiveOnly === false ? {} : { ativo: '1' }),
    ...(options.extraParams ?? {}),
  })

  if (options.fields?.length) {
    params.set('fields', options.fields.join(','))
  }

  return `${resource}?${params.toString()}`
}

export function extractParameterValues(payload: unknown, keys: string[]) {
  const wantedKeys = new Set(keys.map((key) => String(key).trim()).filter(Boolean))

  return [...new Set(
    asArray(asRecord(payload).data)
      .map((item) => asRecord(item))
      .filter((item) => wantedKeys.has(toStringValue(item.chave)))
      .map((item) => toStringValue(item.parametros))
      .filter(Boolean),
  )]
}

