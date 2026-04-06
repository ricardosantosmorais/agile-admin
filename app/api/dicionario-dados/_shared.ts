import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type DicionarioSession = NonNullable<Awaited<ReturnType<typeof readAuthSession>>>
type DicionarioApiResult = Awaited<ReturnType<typeof serverApiFetch>>

type DicionarioSessionResponse =
  | { error: NextResponse }
  | { session: DicionarioSession }

type DicionarioApiFetchResponse =
  | { error: NextResponse }
  | { session: DicionarioSession; result: DicionarioApiResult }

export async function resolveDicionarioSession(): Promise<DicionarioSessionResponse> {
  const session = await readAuthSession()
  if (!session) {
    return {
      error: NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 }),
    }
  }

  return { session }
}

export function getErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
    ? payload.error.message
    : fallback
}

export function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function asArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? value as T[] : []
}

export function asString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

export function isDicionarioApiFetchError(result: DicionarioApiFetchResponse): result is { error: NextResponse } {
  return 'error' in result
}

export async function dicionarioApiFetch(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE'
    body?: unknown
  },
): Promise<DicionarioApiFetchResponse> {
  const resolved = await resolveDicionarioSession()
  if ('error' in resolved) {
    return resolved
  }

  const result = await serverApiFetch(path, {
    method: options.method || 'GET',
    token: resolved.session.token,
    tenantId: resolved.session.currentTenantId,
    body: options.body,
  })

  return {
    session: resolved.session,
    result,
  }
}
