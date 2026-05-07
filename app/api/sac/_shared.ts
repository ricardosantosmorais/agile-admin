import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'

export function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') return payload.message
  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) return payload.error.message
  return fallback
}

export async function requireSacSession() {
  const session = await readAuthSession()
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 }),
    }
  }
  return { session, response: null }
}

export function forwardSearchParams(request: Request, keys: string[], defaults: Record<string, string> = {}) {
  const url = new URL(request.url)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(defaults)) {
    params.set(key, value)
  }
  for (const key of keys) {
    const value = url.searchParams.get(key)
    if (value) params.set(key, value)
  }
  return params.toString()
}
