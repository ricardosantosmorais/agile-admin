import * as Sentry from '@sentry/nextjs'
import type { AuthSession } from '@/src/features/auth/types/auth'

function parseSampleRate(value: string | undefined) {
  if (!value) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function getSentryServerConfig() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
    debug: process.env.SENTRY_DEBUG === 'true',
  }
}

export function getSentryClientConfig() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
    debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',
  }
}

export function applySentrySessionContext(session: AuthSession | null) {
  if (!session) {
    Sentry.setUser(null)
    Sentry.setTag('tenant.id', '')
    Sentry.setTag('tenant.code', '')
    Sentry.setTag('tenant.status', '')
    Sentry.setTag('user.master', '')
    Sentry.setContext('tenant', {})
    Sentry.setContext('auth', {})
    return
  }

  const { currentTenant, tenants, user } = session

  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.nome || undefined,
  })

  Sentry.setTag('tenant.id', currentTenant.id)
  Sentry.setTag('tenant.code', currentTenant.codigo || '')
  Sentry.setTag('tenant.status', currentTenant.status || '')
  Sentry.setTag('user.master', user.master ? 'true' : 'false')

  Sentry.setContext('tenant', {
    id: currentTenant.id,
    codigo: currentTenant.codigo,
    nome: currentTenant.nome,
    status: currentTenant.status,
  })

  Sentry.setContext('auth', {
    cargo: user.cargo,
    nome: user.nome,
    funcionalidades: user.funcionalidades.length,
    tenants: tenants.length,
  })
}

function extractSentryErrorMessage(payload: unknown, fallback = '') {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

const sentryOperationalErrorPattern = /sqlstate|unknown column|base table or view not found|syntax error|invalid datetime format|incorrect datetime value|undefined property|undefined index|call to undefined|integrity constraint/i

export function shouldReportOperationalError(status: number, payload: unknown, fallbackMessage = '') {
  const message = extractSentryErrorMessage(payload, fallbackMessage)
  if (status >= 500) {
    return true
  }

  return sentryOperationalErrorPattern.test(message)
}

function sanitizeSentryPayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) {
    return payload
  }

  if (typeof payload === 'string') {
    return payload.slice(0, 500)
  }

  if (Array.isArray(payload)) {
    return payload.slice(0, 10).map((item) => sanitizeSentryPayload(item))
  }

  if (typeof payload !== 'object') {
    return payload
  }

  const source = payload as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(source)) {
    if (/token|authorization|password|senha|cookie|cpf|cnpj|email|telefone|celular|html|texto/i.test(key)) {
      continue
    }

    if (typeof value === 'string') {
      result[key] = value.slice(0, 300)
      continue
    }

    if (Array.isArray(value)) {
      result[key] = value.slice(0, 10).map((item) => sanitizeSentryPayload(item))
      continue
    }

    if (value && typeof value === 'object') {
      result[key] = sanitizeSentryPayload(value)
      continue
    }

    result[key] = value
  }

  return result
}

export function captureOperationalServerError(input: {
  area: string
  action: string
  path: string
  status: number
  tenantId?: string
  payload: unknown
  requestMeta?: Record<string, unknown>
}) {
  if (!shouldReportOperationalError(input.status, input.payload)) {
    return
  }

  const message = extractSentryErrorMessage(input.payload, 'Operational server error')

  Sentry.withScope((scope) => {
    scope.setLevel('error')
    scope.setTag('error.kind', 'operational')
    scope.setTag('error.area', input.area)
    scope.setTag('error.action', input.action)
    scope.setTag('http.status', String(input.status))
    scope.setTag('request.path', input.path)
    if (input.tenantId) {
      scope.setTag('tenant.id', input.tenantId)
    }
    scope.setContext('response', sanitizeSentryPayload(input.payload) as Record<string, unknown>)
    if (input.requestMeta) {
      scope.setContext('request', sanitizeSentryPayload(input.requestMeta) as Record<string, unknown>)
    }
    Sentry.captureException(new Error(message))
  })
}

export function captureOperationalClientError(input: {
  path: string
  method: string
  status: number
  payload: unknown
}) {
  if (!shouldReportOperationalError(input.status, input.payload)) {
    return
  }

  const message = extractSentryErrorMessage(input.payload, 'Operational client error')

  Sentry.withScope((scope) => {
    scope.setLevel('error')
    scope.setTag('error.kind', 'operational')
    scope.setTag('error.area', 'http-client')
    scope.setTag('http.method', input.method)
    scope.setTag('http.status', String(input.status))
    scope.setTag('request.path', input.path)
    scope.setContext('response', sanitizeSentryPayload(input.payload) as Record<string, unknown>)
    Sentry.captureException(new Error(message))
  })
}
