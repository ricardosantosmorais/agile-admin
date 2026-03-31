import { captureOperationalServerError } from '@/src/lib/sentry'

type ExternalAdminApiTarget = 'painelb2b' | 'agilesync'

type ExternalAdminApiOptions = {
  method?: 'GET' | 'POST'
  query?: string | URLSearchParams | Record<string, string | number | boolean | null | undefined>
  body?: Record<string, string | number | boolean | null | undefined>
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function getBaseUrl(target: ExternalAdminApiTarget) {
  if (target === 'agilesync') {
    return trimTrailingSlash(process.env.ADMIN_URL_API_AGILESYNC || '')
  }

  return trimTrailingSlash(process.env.ADMIN_URL_API_PAINELB2B || '')
}

function getToken(target: ExternalAdminApiTarget) {
  if (target === 'agilesync') {
    return process.env.ADMIN_API_AGILESYNC_TOKEN || process.env.ADMIN_API_PAINELB2B_TOKEN || ''
  }

  return process.env.ADMIN_API_PAINELB2B_TOKEN || ''
}

function toSearchParams(input?: ExternalAdminApiOptions['query'] | ExternalAdminApiOptions['body']) {
  const params = new URLSearchParams()

  if (!input) {
    return params
  }

  if (typeof input === 'string') {
    return new URLSearchParams(input)
  }

  if (input instanceof URLSearchParams) {
    return new URLSearchParams(input)
  }

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    params.set(key, String(value))
  }

  return params
}

export async function externalAdminApiFetch(
  target: ExternalAdminApiTarget,
  path: string,
  options: ExternalAdminApiOptions = {},
) {
  const baseUrl = getBaseUrl(target)
  const token = getToken(target)

  if (!baseUrl || !token) {
    const missingParts = [
      !baseUrl ? `URL (${target})` : '',
      !token ? `token (${target})` : '',
    ].filter(Boolean)

    return {
      ok: false,
      status: 500,
      payload: {
        message: `Editor SQL não configurado. Ajuste ${missingParts.join(' e ')} no ambiente.`,
      },
    }
  }

  const method = options.method ?? 'GET'
  const query = toSearchParams(options.query)
  const querySuffix = query.toString() ? `?${query.toString()}` : ''
  const url = `${baseUrl}/${path.replace(/^\/+/, '')}${querySuffix}`
  const requestBody = options.body ? toSearchParams(options.body).toString() : undefined

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      Token: token,
      'X-API-TOKEN': token,
      ...(requestBody ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}),
    },
    body: requestBody,
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    captureOperationalServerError({
      area: 'external-admin-api',
      action: method.toLowerCase(),
      path: `${target}:${path}`,
      status: response.status,
      payload,
      requestMeta: {
        target,
        bodyKeys: options.body ? Object.keys(options.body) : undefined,
      },
    })
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
  }
}
