import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

type IntegracaoAppsContext = {
  token: string
  tenantId: string
  tenantCodigo: string
}

type IntegrationContextResponse =
  | { error: NextResponse }
  | { context: IntegracaoAppsContext }

type PainelFetchResponse = {
  ok: boolean
  status: number
  payload: unknown
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

export function asArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : []
}

export function asString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

export function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

function getPainelConfig() {
  const baseUrl = trimTrailingSlash(process.env.ADMIN_URL_API_PAINELB2B || '')
  const token = (process.env.ADMIN_API_PAINELB2B_TOKEN || '').trim()

  return { baseUrl, token }
}

export async function resolveIntegracaoAplicativosContext(): Promise<IntegrationContextResponse> {
  const storedSession = await readAuthSession()
  if (!storedSession?.token || !storedSession.currentTenantId) {
    return {
      error: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }),
    }
  }

  const validated = await serverApiFetch('login/validar', {
    method: 'POST',
    token: storedSession.token,
    tenantId: storedSession.currentTenantId,
  })

  if (!validated.ok) {
    return {
      error: NextResponse.json(
        { message: extractApiErrorMessage(validated.payload, 'Sessão inválida.') },
        { status: 401 },
      ),
    }
  }

  const enrichedPayload = await enrichMasterPayload(validated.payload, storedSession.token, storedSession.currentTenantId)
  const session = mapAuthSession(enrichedPayload)
  const tenantCodigo = session.currentTenant.codigo || session.currentTenant.id

  if (!tenantCodigo) {
    return {
      error: NextResponse.json(
        { message: 'Empresa ativa sem código de integração.' },
        { status: 409 },
      ),
    }
  }

  return {
    context: {
      token: storedSession.token,
      tenantId: storedSession.currentTenantId,
      tenantCodigo,
    },
  }
}

export async function painelB2BFetch(path: string, options: {
  method?: 'GET' | 'POST' | 'DELETE'
  query?: Record<string, string | number | boolean | null | undefined>
  body?: unknown
} = {}): Promise<PainelFetchResponse> {
  const config = getPainelConfig()
  if (!config.baseUrl || !config.token) {
    return {
      ok: false,
      status: 500,
      payload: {
        message: 'API externa painelb2b não configurada no ambiente.',
      },
    }
  }

  const method = options.method || 'GET'
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }

  const url = `${config.baseUrl}/${path.replace(/^\/+/, '')}${query.toString() ? `?${query.toString()}` : ''}`

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
      Token: config.token,
      'X-API-TOKEN': config.token,
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const rawPayload = await response.text()
  const payload = contentType.includes('application/json') && rawPayload.trim()
    ? JSON.parse(rawPayload)
    : rawPayload

  return {
    ok: response.ok,
    status: response.status,
    payload,
  }
}

export function generateClientId() {
  return randomBytes(16).toString('hex')
}

export function generateSecret() {
  return randomBytes(32).toString('hex')
}

export function mapMeta(payload: unknown) {
  const meta = asRecord(asRecord(payload).meta)
  return {
    page: Number(meta.page || 1),
    pages: Number(meta.pages || 1),
    perPage: Number(meta.perpage || meta.perPage || 15),
    from: Number(meta.from || 0),
    to: Number(meta.to || 0),
    total: Number(meta.total || 0),
  }
}

