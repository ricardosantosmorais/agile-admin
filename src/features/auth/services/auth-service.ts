import { HttpError, httpClient } from '@/src/services/http/http-client'
import type { AuthSession, LoginCredentials, LoginResult } from '@/src/features/auth/types/auth'

export type SessionProbeResult =
  | { kind: 'authenticated'; session: AuthSession }
  | { kind: 'unauthenticated' }
  | { kind: 'transient_error'; error: unknown }

function isTransientSessionProbeError(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return false
    }

    if (error.status === 408 || error.status === 425 || error.status === 429) {
      return true
    }

    if (error.status >= 500) {
      return true
    }

    const normalized = String(error.message || '').trim().toLowerCase()
    return normalized.includes('<!doctype')
      || normalized.includes('<html')
      || normalized.includes('failed to fetch')
      || normalized.includes('network')
  }

  if (error instanceof TypeError) {
    return true
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }

  const normalized = String((error as { message?: unknown } | null)?.message || '').trim().toLowerCase()
  return normalized.includes('failed to fetch')
    || normalized.includes('network')
    || normalized.includes('load failed')
    || normalized.includes('fetch')
    || normalized.includes('econnrefused')
    || normalized.includes('econnreset')
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    return httpClient<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },
  async getSession(tenantId?: string): Promise<AuthSession | null> {
    try {
      const search = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''

      return await httpClient<AuthSession>(`/api/auth/session${search}`, {
        method: 'GET',
      })
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        return null
      }

      throw error
    }
  },
  async probeSession(tenantId?: string): Promise<SessionProbeResult> {
    try {
      const search = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
      const session = await httpClient<AuthSession>(`/api/auth/session${search}`, {
        method: 'GET',
      })

      return { kind: 'authenticated', session }
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        return { kind: 'unauthenticated' }
      }

      if (isTransientSessionProbeError(error)) {
        return { kind: 'transient_error', error }
      }

      throw error
    }
  },
  async logout() {
    await httpClient<{ success: true }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  async switchTenant(tenantId: string): Promise<AuthSession> {
    return httpClient<AuthSession>('/api/auth/tenant', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    })
  },
}
