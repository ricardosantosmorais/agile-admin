import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

export type ConsultasContext = {
  token: string
  tenantId: string
  userId: string
}

export function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

export function asArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? value as T[] : []
}

export function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

export function extractApiErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim()
    }

    const error = 'error' in payload ? payload.error : null
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim()
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }

  return fallback
}

export async function resolveConsultasContext() {
  const session = await readAuthSession()
  if (!session?.token || !session.currentTenantId || !session.currentUserId) {
    return {
      error: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }),
    }
  }

  return {
    context: {
      token: session.token,
      tenantId: session.currentTenantId,
      userId: session.currentUserId,
    } satisfies ConsultasContext,
  }
}

export async function serverTenantFetch(
  context: ConsultasContext,
  path: string,
  options?: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown },
) {
  return serverApiFetch(path, {
    method: options?.method ?? 'GET',
    token: context.token,
    tenantId: context.tenantId,
    body: options?.body,
  })
}

export async function painelb2bFetch(
  path: string,
  options?: {
    method?: 'GET' | 'POST'
    query?: string | URLSearchParams | Record<string, string | number | boolean | null | undefined>
    body?: Record<string, string | number | boolean | null | undefined>
    tokenOverride?: string
  },
) {
  return externalAdminApiFetch('painelb2b', path, options)
}

export async function agilesyncFetch(
  path: string,
  options?: {
    method?: 'GET' | 'POST'
    query?: string | URLSearchParams | Record<string, string | number | boolean | null | undefined>
    body?: Record<string, string | number | boolean | null | undefined>
    tokenOverride?: string
  },
) {
  return externalAdminApiFetch('agilesync', path, options)
}

function buildAgileV2BaseUrl() {
  const explicit = (process.env.ADMIN_URL_API_AGILE || '').trim()
  if (explicit) {
    return explicit.replace(/\/+$/, '')
  }

  const painelb2b = (process.env.ADMIN_URL_API_PAINELB2B || '').trim()
  if (!painelb2b) {
    return ''
  }

  return painelb2b.replace(/\/api\/v1\/?$/i, '/api/v2').replace(/\/+$/, '')
}

export async function agileV2Fetch(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE'
    query?: string | URLSearchParams | Record<string, string | number | boolean | null | undefined>
    body?: Record<string, string | number | boolean | null | undefined>
  } = {},
) {
  const baseUrl = buildAgileV2BaseUrl()
  const token = (process.env.ADMIN_API_AGILE_TOKEN || process.env.ADMIN_API_PAINELB2B_TOKEN || '').trim()

  if (!baseUrl || !token) {
    return {
      ok: false,
      status: 500,
      payload: {
        message: 'API Agile v2 não configurada. Ajuste URL e token no ambiente.',
      },
    }
  }

  const method = options.method ?? 'GET'
  const query = options.query instanceof URLSearchParams
    ? new URLSearchParams(options.query)
    : typeof options.query === 'string'
      ? new URLSearchParams(options.query)
      : new URLSearchParams()

  if (typeof options.query === 'object' && options.query !== null && !(options.query instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null || value === '') continue
      query.set(key, String(value))
    }
  }

  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(options.body || {})) {
    if (value === undefined || value === null || value === '') continue
    body.set(key, String(value))
  }

  const url = `${baseUrl}/${path.replace(/^\/+/, '')}${query.toString() ? `?${query.toString()}` : ''}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        Token: token,
        'X-API-TOKEN': token,
        ...(method !== 'GET' ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}),
      },
      body: method !== 'GET' ? body.toString() : undefined,
      cache: 'no-store',
    })

    const contentType = response.headers.get('content-type') ?? ''
    const raw = await response.text()
    const payload = contentType.includes('application/json') && raw.trim() ? JSON.parse(raw) : raw

    return {
      ok: response.ok,
      status: response.status,
      payload,
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      payload: {
        message: error instanceof Error ? error.message : 'Falha inesperada ao chamar a API Agile v2.',
      },
    }
  }
}
