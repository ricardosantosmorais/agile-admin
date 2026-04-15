import { isAuthenticatedSessionRecentlyEstablished } from '@/src/features/auth/services/auth-tab-storage'
import { getSessionClientPhase } from '@/src/features/auth/services/session-client-gate'
import { translateCurrentLocale } from '@/src/i18n/utils'
import { captureOperationalClientError } from '@/src/lib/sentry'

export class HttpError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.payload = payload
  }
}

export const SESSION_LOST_EVENT = 'admin-v2-web:session-lost'

export type SessionLostReason =
  | 'idle_timeout'
  | 'expired_no_action'
  | 'csrf_invalid'
  | 'tenant_context_invalid'
  | 'session_expired_or_recycled'
  | 'unauthenticated'
  | 'http_401'
  | 'unknown'

type SessionLostDetail = {
  reason: SessionLostReason
  message: string
  status: number
  path: string
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
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

function inferSessionLostReason(status: number, message: string): SessionLostReason {
  const normalized = String(message || '').trim().toLowerCase()

  if (normalized.includes('csrf')) {
    return 'csrf_invalid'
  }

  if (normalized.includes('tenant') || normalized.includes('contexto')) {
    return 'tenant_context_invalid'
  }

  if (
    normalized.includes('expirada')
    || normalized.includes('expirou')
    || normalized.includes('sessão não encontrada')
    || normalized.includes('sessao nao encontrada')
  ) {
    return 'session_expired_or_recycled'
  }

  if (normalized.includes('autentica') || normalized.includes('unauthenticated')) {
    return 'unauthenticated'
  }

  if (status === 401) {
    return 'http_401'
  }

  return 'unknown'
}

function shouldNotifySessionLoss(path: string) {
  if (isAuthenticatedSessionRecentlyEstablished()) {
    return false
  }

  return ![
    '/api/auth/logout',
    '/api/auth/session',
    '/api/auth/login',
  ].some((prefix) => path.startsWith(prefix))
}

function canRequestWhileSessionBlocked(path: string) {
  return [
    '/api/auth/logout',
    '/api/auth/login',
    '/api/auth/session',
  ].some((prefix) => path.startsWith(prefix))
}

export function notifySessionLost(reason: SessionLostReason, message: string, status = 401, path = '') {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent<SessionLostDetail>(SESSION_LOST_EVENT, {
    detail: {
      reason,
      message,
      status,
      path,
    },
  }))
}

export async function httpClient<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const path = getRequestPath(input)
  const method = String(init?.method || 'GET').toUpperCase()
  const phase = getSessionClientPhase()
  const sessionEndedMessage = translateCurrentLocale('http.sessionEnded', 'Sessão encerrada. Faça login novamente para continuar.')

  if ((phase === 'warning' || phase === 'ended') && !canRequestWhileSessionBlocked(path)) {
    throw new HttpError(sessionEndedMessage, 401, {
      message: sessionEndedMessage,
      blockedByClientSessionGate: true,
      path,
      phase,
    })
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const payload = await parseResponse(response)

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : null)
      ?? translateCurrentLocale('http.requestError', 'Não foi possível concluir a requisição.')

    if (response.status === 401 && shouldNotifySessionLoss(path)) {
      notifySessionLost(inferSessionLostReason(response.status, message), message, response.status, path)
    }

    captureOperationalClientError({
      path,
      method,
      status: response.status,
      payload,
    })

    throw new HttpError(message, response.status, payload)
  }

  return payload as T
}
