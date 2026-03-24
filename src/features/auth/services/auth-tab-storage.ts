'use client'

import type { PendingLogin } from '@/src/features/auth/types/auth'

const ACTIVE_TENANT_KEY = 'admin-v2-web:tenant'
const PENDING_LOGIN_KEY = 'admin-v2-web:auth-pending'
const AUTHENTICATED_MARKER_KEY = 'admin-v2-web:auth-seen'
const SESSION_LOCK_KEY = 'admin-v2-web:session-locked'
const SENSITIVE_SESSION_KEYS = [
  ACTIVE_TENANT_KEY,
  PENDING_LOGIN_KEY,
  'tenant_active_tab_id',
]
const SENSITIVE_LOCAL_STORAGE_KEYS = [
  ACTIVE_TENANT_KEY,
  PENDING_LOGIN_KEY,
  AUTHENTICATED_MARKER_KEY,
  SESSION_LOCK_KEY,
  'admin-v2-web:session-activity-global',
  'admin-v2-web:session-end-global',
]

type SessionLockPayload = {
  reason: string
  ts: number
}

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

export function loadActiveTenantId() {
  return getSessionStorage()?.getItem(ACTIVE_TENANT_KEY) ?? ''
}

export function storeActiveTenantId(tenantId: string) {
  if (!tenantId) {
    getSessionStorage()?.removeItem(ACTIVE_TENANT_KEY)
    return
  }

  getSessionStorage()?.setItem(ACTIVE_TENANT_KEY, tenantId)
}

export function clearActiveTenantId() {
  getSessionStorage()?.removeItem(ACTIVE_TENANT_KEY)
}

export function loadPendingLogin(): PendingLogin | null {
  const raw = getSessionStorage()?.getItem(PENDING_LOGIN_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as PendingLogin
  } catch {
    getSessionStorage()?.removeItem(PENDING_LOGIN_KEY)
    return null
  }
}

export function storePendingLogin(value: PendingLogin) {
  getSessionStorage()?.setItem(PENDING_LOGIN_KEY, JSON.stringify(value))
}

export function clearPendingLogin() {
  getSessionStorage()?.removeItem(PENDING_LOGIN_KEY)
}

export function hasAuthenticatedSessionMarker() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(AUTHENTICATED_MARKER_KEY) === '1'
}

export function markAuthenticatedSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTHENTICATED_MARKER_KEY, '1')
}

export function clearAuthenticatedSessionMarker() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTHENTICATED_MARKER_KEY)
}

export function readSessionLock() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(SESSION_LOCK_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionLockPayload
  } catch {
    window.localStorage.removeItem(SESSION_LOCK_KEY)
    return null
  }
}

export function markSessionLocked(reason: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SESSION_LOCK_KEY, JSON.stringify({
    reason,
    ts: Date.now(),
  } satisfies SessionLockPayload))
}

export function clearSessionLock() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(SESSION_LOCK_KEY)
}

export function clearSensitiveClientState() {
  if (typeof window === 'undefined') {
    return
  }

  const session = getSessionStorage()
  if (session) {
    for (const key of SENSITIVE_SESSION_KEYS) {
      session.removeItem(key)
    }

    for (let index = session.length - 1; index >= 0; index -= 1) {
      const key = session.key(index)
      if (key?.startsWith('admin-v2-web:')) {
        session.removeItem(key)
      }
    }
  }

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (!key) {
      continue
    }

    if (key.startsWith('dashboard-v2:') || SENSITIVE_LOCAL_STORAGE_KEYS.includes(key)) {
      window.localStorage.removeItem(key)
    }
  }
}
