import { captureOperationalServerError } from '@/src/lib/sentry'

type ExternalAdminApiTarget = 'painelb2b' | 'agilesync'

type ExternalAdminApiOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  query?: string | URLSearchParams | Record<string, string | number | boolean | null | undefined>
  body?: Record<string, string | number | boolean | null | undefined>
  tokenOverride?: string
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

function getToken(target: ExternalAdminApiTarget, tokenOverride?: string) {
  if (tokenOverride?.trim()) {
    return tokenOverride.trim()
  }

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
  const token = getToken(target, options.tokenOverride)

  if (!baseUrl || !token) {
    const missingParts = [
      !baseUrl ? `URL (${target})` : '',
      !token ? `token (${target})` : '',
    ].filter(Boolean)

    return {
      ok: false,
      status: 500,
      payload: {
        message: `API externa não configurada. Ajuste ${missingParts.join(' e ')} no ambiente.`,
      },
    }
  }

  const method = options.method ?? 'GET'
  const query = toSearchParams(options.query)
  const queryString = query.toString()
  const normalizedPath = path.replace(/^\/+/, '')
  const url = /^https?:\/\//i.test(normalizedPath)
    ? `${normalizedPath}${queryString ? `${normalizedPath.includes('?') ? '&' : '?'}${queryString}` : ''}`
    : `${baseUrl}/${normalizedPath}${queryString ? `?${queryString}` : ''}`
  const requestBody = options.body ? toSearchParams(options.body).toString() : undefined

  try {
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
    const rawPayload = await response.text()
    const payload = contentType.includes('application/json') && rawPayload.trim()
      ? JSON.parse(rawPayload)
      : rawPayload

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha inesperada ao chamar a API externa.'

    captureOperationalServerError({
      area: 'external-admin-api',
      action: method.toLowerCase(),
      path: `${target}:${path}`,
      status: 500,
      payload: { message },
      requestMeta: {
        target,
        bodyKeys: options.body ? Object.keys(options.body) : undefined,
      },
    })

    return {
      ok: false,
      status: 500,
      payload: {
        message,
      },
    }
  }
}
