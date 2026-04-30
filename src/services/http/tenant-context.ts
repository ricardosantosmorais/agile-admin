import { loadActiveTenantId } from '@/src/features/auth/services/auth-tab-storage'
import { ACTIVE_TENANT_REQUEST_HEADER } from '@/src/features/auth/services/request-tenant'

type TenantContextHeadersOptions = {
  defaultContentType?: string | null
}

function getRequestPath(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.pathname
  }

  return input.url
}

function toHeaderRecord(headers?: HeadersInit, options: TenantContextHeadersOptions = {}) {
  const defaultContentType = options.defaultContentType ?? null
  const nextHeaders: Record<string, string> = defaultContentType
    ? { 'Content-Type': defaultContentType }
    : {}

  if (!headers) {
    return nextHeaders
  }

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      nextHeaders[key] = value
    })
    return nextHeaders
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      nextHeaders[key] = value
    }
    return nextHeaders
  }

  return {
    ...nextHeaders,
    ...headers,
  }
}

function hasHeader(headers: Record<string, string>, headerName: string) {
  const normalizedHeaderName = headerName.toLowerCase()
  return Object.keys(headers).some((key) => key.toLowerCase() === normalizedHeaderName)
}

function shouldAttachActiveTenant(path: string) {
  return path.startsWith('/api/') && !path.startsWith('/api/auth/login')
}

export function buildTenantContextHeaders(
  path: string,
  headers?: HeadersInit,
  options: TenantContextHeadersOptions = {},
) {
  const nextHeaders = toHeaderRecord(headers, options)
  const activeTenantId = loadActiveTenantId()

  if (activeTenantId && shouldAttachActiveTenant(path) && !hasHeader(nextHeaders, ACTIVE_TENANT_REQUEST_HEADER)) {
    nextHeaders[ACTIVE_TENANT_REQUEST_HEADER] = activeTenantId
  }

  return nextHeaders
}

export function fetchWithTenantContext(input: RequestInfo | URL, init?: RequestInit) {
  const path = getRequestPath(input)

  return fetch(input, {
    ...init,
    headers: buildTenantContextHeaders(path, init?.headers),
  })
}
