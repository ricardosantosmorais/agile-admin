import { NextRequest, NextResponse } from 'next/server'
import {
  maskRequestHeaders,
  resolveHttpClientContext,
} from '@/app/api/http-client/_shared'
import { normalizeHttpClientDraft } from '@/src/features/http-client/services/http-client-mappers'
import type { HttpClientMethod } from '@/src/features/http-client/services/http-client-types'

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function buildEndpointFromCatalog(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return { endpoint: '', method: '' as HttpClientMethod | '' }
  }

  const spaceIndex = normalized.indexOf(' ')
  if (spaceIndex <= 0) {
    return { endpoint: normalized, method: '' as HttpClientMethod | '' }
  }

  const method = normalized.slice(0, spaceIndex).trim().toUpperCase() as HttpClientMethod
  const endpoint = normalized.slice(spaceIndex + 1).trim()
  return { endpoint, method }
}

function buildTargetUrl(baseUrl: string, endpoint: string) {
  const normalizedBase = String(baseUrl || '').trim()
  const normalizedEndpoint = String(endpoint || '').trim()

  if (normalizedEndpoint && /^https?:\/\//i.test(normalizedEndpoint)) {
    return normalizedEndpoint
  }

  if (normalizedBase && normalizedEndpoint) {
    return `${normalizedBase.replace(/\/+$/, '')}/${normalizedEndpoint.replace(/^\/+/, '')}`
  }

  return normalizedEndpoint || normalizedBase
}

function buildMergedQueryParams(queryString: string, rows: Array<{ key: string; value: string }>) {
  const params = new URLSearchParams()

  const normalizedQuery = queryString.trim().replace(/^[?&]+/, '')
  if (normalizedQuery) {
    const parsed = new URLSearchParams(normalizedQuery)
    parsed.forEach((value, key) => {
      params.append(key, value)
    })
  }

  for (const row of rows) {
    const key = row.key.trim()
    if (!key) continue
    params.append(key, row.value)
  }

  return params
}

function resolveEndpointPathTemplate(endpoint: string, params: URLSearchParams) {
  const normalized = endpoint.trim()
  if (!normalized) return normalized

  const segments = normalized.split('/')
  const resolvedSegments: string[] = []

  for (const segment of segments) {
    const match = segment.match(/^\{([^}]+)\}$/)
    if (!match) {
      resolvedSegments.push(segment)
      continue
    }

    const rawName = match[1]
    const optional = rawName.endsWith('?')
    const paramName = optional ? rawName.slice(0, -1) : rawName
    const value = params.get(paramName)

    if (value !== null && value !== '') {
      params.delete(paramName)
      resolvedSegments.push(encodeURIComponent(value))
      continue
    }

    if (optional) {
      continue
    }

    return {
      ok: false as const,
      message: `Parametro de rota obrigatorio ausente: ${paramName}`,
      endpoint: normalized,
    }
  }

  const resolved = resolvedSegments.join('/')
  return {
    ok: true as const,
    endpoint: resolved,
  }
}

function appendQueryParams(url: string, params: URLSearchParams) {
  const query = params.toString()
  if (!query) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${query}`
}

function isBodyAllowed(method: HttpClientMethod) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
}

export async function POST(request: NextRequest) {
  const resolved = await resolveHttpClientContext()
  if (resolved.error) return resolved.error

  const body = await request.json().catch(() => null)
  const draft = normalizeHttpClientDraft(body)

  let method = draft.method
  let endpoint = draft.endpointCustom
  if (draft.endpointMode === 'agile') {
    const fromCatalog = buildEndpointFromCatalog(draft.endpointCatalogValue)
    endpoint = fromCatalog.endpoint
    if (fromCatalog.method) {
      method = fromCatalog.method
    }
  }

  const queryParams = buildMergedQueryParams(draft.filtersQuery, draft.queryRows)
  const resolvedEndpoint = resolveEndpointPathTemplate(endpoint, queryParams)
  if (!resolvedEndpoint.ok) {
    return NextResponse.json({ message: resolvedEndpoint.message }, { status: 400 })
  }

  let url = buildTargetUrl(draft.baseUrl, resolvedEndpoint.endpoint)
  url = appendQueryParams(url, queryParams)

  if (!url.trim()) {
    return NextResponse.json({ message: 'Informe uma URL valida para enviar a requisicao.' }, { status: 400 })
  }

  if (/[\r\n]/.test(url)) {
    return NextResponse.json({ message: 'URL invalida.' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ message: 'URL invalida. Informe uma URL HTTP/HTTPS completa.' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ message: 'Apenas URLs HTTP/HTTPS sao permitidas.' }, { status: 400 })
  }

  const headers = new Headers()
  for (const row of draft.headers) {
    const key = row.key.trim()
    if (!key) continue
    if (/[\r\n]/.test(row.key) || /[\r\n]/.test(row.value)) {
      return NextResponse.json({ message: 'Header invalido: quebras de linha nao sao permitidas.' }, { status: 400 })
    }
    headers.set(key, row.value)
  }

  if (draft.includeEmpresaHeader && resolved.context.empresaHeader && !headers.has('Empresa')) {
    headers.set('Empresa', resolved.context.empresaHeader)
  }

  if (draft.authType === 'platform') {
    if (!resolved.context.platformToken) {
      return NextResponse.json({ message: 'Nao foi possivel localizar o token da empresa para autenticacao da Plataforma.' }, { status: 409 })
    }
    headers.set('Authorization', `Bearer ${resolved.context.platformToken}`)
  }

  if (draft.authType === 'bearer') {
    if (!draft.bearerToken.trim()) {
      return NextResponse.json({ message: 'Informe o Bearer token para autenticacao customizada.' }, { status: 400 })
    }
    headers.set('Authorization', `Bearer ${draft.bearerToken.trim()}`)
  }

  if (draft.authType === 'basic') {
    const encoded = Buffer.from(`${draft.basicUser}:${draft.basicPass}`).toString('base64')
    headers.set('Authorization', `Basic ${encoded}`)
  }

  if (isBodyAllowed(method) && draft.body.trim() && !headers.has('Content-Type')) {
    headers.set('Content-Type', draft.bodyType)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, draft.timeoutSeconds * 1000)

  const startedAt = Date.now()
  try {
    const response = await fetch(parsedUrl.toString(), {
      method,
      headers,
      body: isBodyAllowed(method) ? draft.body : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })
    const responseBody = await response.text()
    const durationMs = Date.now() - startedAt

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return NextResponse.json({
      request: {
        url: parsedUrl.toString(),
        method,
        headers: maskRequestHeaders(headers),
      },
      response: {
        status: response.status,
        durationMs,
        contentType: response.headers.get('content-type') || '',
        headers: responseHeaders,
        body: responseBody,
      },
    })
  } catch (error) {
    const record = asRecord(error)
    const isAbort = record.name === 'AbortError'
    return NextResponse.json(
      { message: isAbort ? 'Requisicao excedeu o timeout configurado.' : 'Falha na requisicao HTTP.' },
      { status: isAbort ? 408 : 500 },
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
