'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { usePathname } from 'next/navigation'
import { Clock3, LogIn } from 'lucide-react'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import {
  hasAuthenticatedSessionMarker,
  markSessionLocked,
  readSessionLock,
} from '@/src/features/auth/services/auth-tab-storage'
import { authService } from '@/src/features/auth/services/auth-service'
import { useI18n } from '@/src/i18n/use-i18n'
import { SESSION_LOST_EVENT, type SessionLostReason } from '@/src/services/http/http-client'

const SESSION_ACTIVITY_KEY = 'admin-v2-web:session-activity-global'
const SESSION_END_KEY = 'admin-v2-web:session-end-global'
const SESSION_TAB_KEY = 'admin-v2-web:session-tab-id'
const DEFAULT_IDLE_TIMEOUT_SECONDS = 7200
const DEFAULT_WARNING_TIMEOUT_SECONDS = 120

type TranslateFn = (key: string, fallback?: string, params?: Record<string, string | number>) => string

type SessionLifecycleContextValue = {
  shouldBlockUnauthenticatedRedirect: boolean
  endedReason: SessionLostReason | null
}

type SessionModalState =
  | {
      phase: 'warning'
      reason: SessionLostReason
    }
  | {
      phase: 'ended'
      reason: SessionLostReason
    }
  | null

type SessionEndPayload = {
  reason: SessionLostReason
  tabId: string
  ts: number
}

const SessionLifecycleContext = createContext<SessionLifecycleContextValue | undefined>(undefined)

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function getSessionTabId() {
  if (typeof window === 'undefined') {
    return ''
  }

  const existing = window.sessionStorage.getItem(SESSION_TAB_KEY)
  if (existing) {
    return existing
  }

  const nextTabId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  window.sessionStorage.setItem(SESSION_TAB_KEY, nextTabId)
  return nextTabId
}

function writeGlobalActivity(reason: string) {
  const payload = { ts: Date.now(), reason }
  writeJson(SESSION_ACTIVITY_KEY, payload)
  return payload.ts
}

function readGlobalActivityTs() {
  return readJson<{ ts?: number }>(SESSION_ACTIVITY_KEY)?.ts ?? 0
}

function writeGlobalSessionEnd(reason: SessionLostReason, tabId: string) {
  const payload: SessionEndPayload = {
    reason,
    tabId,
    ts: Date.now(),
  }

  writeJson(SESSION_END_KEY, payload)
}

function readGlobalSessionEnd() {
  return readJson<SessionEndPayload>(SESSION_END_KEY)
}

function isReloadNavigation() {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return false
  }

  const navigationEntries = window.performance.getEntriesByType('navigation')
  const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming | undefined
  return navigationEntry?.type === 'reload'
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getSessionEndCopy(t: TranslateFn, reason: SessionLostReason) {
  if (reason === 'idle_timeout' || reason === 'expired_no_action') {
    return {
      title: t('session.ended.idleTitle', 'Sessão encerrada por inatividade'),
      text: t('session.ended.idleText', 'Você ficou inativo por muito tempo e sua sessão foi encerrada.'),
    }
  }

  if (reason === 'csrf_invalid') {
    return {
      title: t('session.ended.securityTitle', 'Sessão encerrada por segurança'),
      text: t('session.ended.securityText', 'Sua sessão de segurança ficou inválida. Faça login novamente.'),
    }
  }

  if (reason === 'tenant_context_invalid') {
    return {
      title: t('session.ended.contextTitle', 'Sessão encerrada'),
      text: t('session.ended.contextText', 'O contexto da sua sessão ficou inválido. Faça login novamente.'),
    }
  }

  if (reason === 'session_expired_or_recycled') {
    return {
      title: t('session.ended.expiredTitle', 'Sessão expirada'),
      text: t('session.ended.expiredText', 'Sua sessão expirou. Faça login novamente para continuar.'),
    }
  }

  if (reason === 'unauthenticated' || reason === 'http_401') {
    return {
      title: t('session.ended.authTitle', 'Sessão encerrada'),
      text: t('session.ended.authText', 'Sua autenticação não é mais válida. Faça login novamente.'),
    }
  }

  return {
    title: t('session.ended.defaultTitle', 'Sessão encerrada'),
    text: t('session.ended.defaultText', 'Sua sessão foi encerrada. Faça login novamente para continuar.'),
  }
}

export function SessionLifecycleProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, refreshSession, session, status } = useAuth()
  const { t } = useI18n()
  const pathname = usePathname()
  const [modalState, setModalState] = useState<SessionModalState>(null)
  const [countdownSeconds, setCountdownSeconds] = useState(DEFAULT_WARNING_TIMEOUT_SECONDS)
  const [isContinuing, setIsContinuing] = useState(false)
  const lastActivityWriteRef = useRef(0)
  const warningStartsAtRef = useRef(0)
  const expireAtRef = useRef(0)
  const countdownIntervalRef = useRef<number | null>(null)
  const sessionTabIdRef = useRef('')
  const logoutRequestedRef = useRef(false)
  const isLoginPage = pathname === '/login'
  const hasSessionMarker = hasAuthenticatedSessionMarker()
  const hasLockedSession = Boolean(readSessionLock())
  const reloadedAfterSessionEnd = !isLoginPage
    && status === 'unauthenticated'
    && hasSessionMarker
    && hasLockedSession
    && isReloadNavigation()
  const shouldBlockUnauthenticatedRedirect = modalState?.phase === 'ended'
    || (!reloadedAfterSessionEnd && !isLoginPage && status === 'unauthenticated' && hasSessionMarker)

  const idleTimeoutMs = (session?.sessionIdleTimeoutSeconds ?? DEFAULT_IDLE_TIMEOUT_SECONDS) * 1000
  const warningTimeoutMs = (session?.sessionWarningTimeoutSeconds ?? DEFAULT_WARNING_TIMEOUT_SECONDS) * 1000

  const clearCountdownTimer = useCallback(() => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const syncDeadlinesFromGlobalActivity = useCallback((writeIfMissing: boolean) => {
    const now = Date.now()
    const maxAllowedAgeMs = idleTimeoutMs + warningTimeoutMs
    let globalTs = readGlobalActivityTs()

    const isStale = globalTs > 0 && maxAllowedAgeMs > 0 && (now - globalTs) > maxAllowedAgeMs
    const isFuture = globalTs > now + 60_000

    if ((globalTs <= 0 || isStale || isFuture) && writeIfMissing) {
      globalTs = writeGlobalActivity('bootstrap')
    }

    if (globalTs <= 0) {
      globalTs = now
    }

    warningStartsAtRef.current = globalTs + idleTimeoutMs
    expireAtRef.current = warningStartsAtRef.current + warningTimeoutMs
  }, [idleTimeoutMs, warningTimeoutMs])

  const closeWarning = useCallback(() => {
    clearCountdownTimer()
    setModalState((current) => (current?.phase === 'warning' ? null : current))
    setIsContinuing(false)
  }, [clearCountdownTimer])

  const openEndedModal = useCallback((reason: SessionLostReason, broadcast = true) => {
    if (isLoginPage) {
      return
    }

    closeWarning()
    markSessionLocked(reason)
    setModalState({ phase: 'ended', reason })

    if (broadcast) {
      writeGlobalSessionEnd(reason, sessionTabIdRef.current)
    }
  }, [closeWarning, isLoginPage])

  const openWarningModal = useCallback(() => {
    if (isLoginPage || modalState?.phase === 'ended') {
      return
    }

    setModalState((current) => current ?? { phase: 'warning', reason: 'idle_timeout' })
  }, [isLoginPage, modalState?.phase])

  const continueSession = useCallback(async () => {
    setIsContinuing(true)

    try {
      const refreshed = await refreshSession()
      if (!refreshed) {
        openEndedModal('session_expired_or_recycled')
        return
      }

      writeGlobalActivity('continue_session')
      syncDeadlinesFromGlobalActivity(true)
      closeWarning()
    } catch {
      openEndedModal('session_expired_or_recycled')
    } finally {
      setIsContinuing(false)
    }
  }, [closeWarning, openEndedModal, refreshSession, syncDeadlinesFromGlobalActivity])

  useEffect(() => {
    sessionTabIdRef.current = getSessionTabId()
  }, [])

  useEffect(() => {
    if (isLoginPage) {
      return
    }

    const sessionLock = readSessionLock()
    if (!sessionLock) {
      return
    }

    if (isReloadNavigation()) {
      return
    }

    openEndedModal((sessionLock.reason as SessionLostReason) || 'unknown', false)
  }, [isLoginPage, openEndedModal])

  useEffect(() => {
    if (!shouldBlockUnauthenticatedRedirect || modalState?.phase === 'ended') {
      return
    }

    openEndedModal('session_expired_or_recycled', false)
  }, [modalState?.phase, openEndedModal, shouldBlockUnauthenticatedRedirect])

  useEffect(() => {
    if (modalState?.phase !== 'ended') {
      logoutRequestedRef.current = false
      return
    }

    if (logoutRequestedRef.current) {
      return
    }

    logoutRequestedRef.current = true
    void authService.logout().catch(() => undefined)
  }, [modalState?.phase])

  useEffect(() => {
    if (!isAuthenticated || isLoginPage) {
      closeWarning()
      return
    }

    syncDeadlinesFromGlobalActivity(true)

    const onActivity = () => {
      const now = Date.now()
      if (modalState?.phase === 'warning' || modalState?.phase === 'ended') {
        return
      }

      if (now - lastActivityWriteRef.current < 1000) {
        return
      }

      lastActivityWriteRef.current = now
      writeGlobalActivity('user_activity')
      syncDeadlinesFromGlobalActivity(false)
    }

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'mouseup', 'touchend', 'scroll']
    for (const eventName of events) {
      window.addEventListener(eventName, onActivity, { passive: true })
    }

    const intervalId = window.setInterval(() => {
      const now = Date.now()

      if (now >= expireAtRef.current) {
        openEndedModal('expired_no_action')
        return
      }

      if (now >= warningStartsAtRef.current) {
        openWarningModal()
      }
    }, 1000)

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity)
      }

      window.clearInterval(intervalId)
    }
  }, [closeWarning, isAuthenticated, isLoginPage, modalState?.phase, openEndedModal, openWarningModal, syncDeadlinesFromGlobalActivity])

  useEffect(() => {
    if (modalState?.phase !== 'warning') {
      clearCountdownTimer()
      return
    }

    const tick = () => {
      const remainingMs = expireAtRef.current - Date.now()
      if (remainingMs <= 0) {
        clearCountdownTimer()
        openEndedModal('expired_no_action')
        return
      }

      setCountdownSeconds(Math.ceil(remainingMs / 1000))
    }

    tick()
    countdownIntervalRef.current = window.setInterval(tick, 1000)

    return clearCountdownTimer
  }, [clearCountdownTimer, modalState?.phase, openEndedModal])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_ACTIVITY_KEY && isAuthenticated) {
        syncDeadlinesFromGlobalActivity(false)
        if (modalState?.phase === 'warning') {
          closeWarning()
        }
      }

      if (event.key === SESSION_END_KEY) {
        const payload = readGlobalSessionEnd()
        if (!payload || payload.tabId === sessionTabIdRef.current) {
          return
        }

        openEndedModal(payload.reason, false)
      }
    }

    const onSessionLost = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: SessionLostReason }>).detail
      openEndedModal(detail?.reason ?? 'http_401')
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(SESSION_LOST_EVENT, onSessionLost)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SESSION_LOST_EVENT, onSessionLost)
    }
  }, [closeWarning, isAuthenticated, modalState?.phase, openEndedModal, syncDeadlinesFromGlobalActivity])

  const warningTitle = t('session.warning.title', 'Sua sessão está prestes a expirar')
  const warningText = t(
    'session.warning.text',
    'Para continuar navegando, clique em continuar sessão antes do tempo acabar.',
  )
  const value = useMemo<SessionLifecycleContextValue>(() => ({
    shouldBlockUnauthenticatedRedirect,
    endedReason: modalState?.phase === 'ended' ? modalState.reason : null,
  }), [modalState, shouldBlockUnauthenticatedRedirect])

  return (
    <SessionLifecycleContext.Provider value={value}>
      {children}
      {modalState?.phase === 'warning' ? (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-[rgba(15,23,42,0.16)] p-4">
          <div className="w-full max-w-xl rounded-[1.6rem] border border-[#e6dfd3] bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.22)]">
            <div className="mb-5 flex items-start gap-4">
              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight text-slate-950">{warningTitle}</h2>
                <p className="text-sm leading-6 text-slate-600">{warningText}</p>
              </div>
            </div>

            <div className="mb-6 flex flex-col items-center justify-center py-2 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
                {t('session.warning.remaining', 'Tempo restante')}
              </div>
              <div className="mt-2 text-5xl font-black tracking-[0.18em] text-slate-950">
                {formatCountdown(countdownSeconds)}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => openEndedModal('idle_timeout')}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#ddd3c4] px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t('session.ended.goToLogin', 'Ir para login')}
              </button>
              <button
                type="button"
                onClick={() => void continueSession()}
                disabled={isContinuing}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#0f172a] px-5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-wait disabled:opacity-70"
              >
                {isContinuing
                  ? t('session.warning.continuing', 'Continuando...')
                  : t('session.warning.continue', 'Continuar sessão')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SessionLifecycleContext.Provider>
  )
}

export function useSessionLifecycle() {
  const context = useContext(SessionLifecycleContext)
  if (!context) {
    throw new Error('useSessionLifecycle precisa ser usado dentro de SessionLifecycleProvider')
  }

  return context
}
