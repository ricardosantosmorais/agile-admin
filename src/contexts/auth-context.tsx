'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { authService } from '@/src/features/auth/services/auth-service'
import {
  clearAuthenticatedSessionMarker,
  clearPendingLogin,
  clearSessionEndSignal,
  clearSessionLock,
  clearSensitiveClientState,
  hasAuthenticatedSessionMarker,
  loadActiveTenantId,
  loadPendingLogin,
  markAuthenticatedSession,
  readSessionLock,
  storeActiveTenantId,
  storePendingLogin,
} from '@/src/features/auth/services/auth-tab-storage'
import { clearSessionClientPhase } from '@/src/features/auth/services/session-client-gate'
import type { AuthSession, AuthUser } from '@/src/features/auth/types/auth'
import { applySentrySessionContext } from '@/src/lib/sentry'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'challenge'

type AuthContextValue = {
  status: AuthStatus
  isAuthenticated: boolean
  isLoading: boolean
  user: AuthUser | null
  session: AuthSession | null
  challengeMessage: string
  login: (email: string, senha: string) => Promise<'authenticated' | 'challenge'>
  submitAuthenticationCode: (codigoAutenticacao: string) => Promise<'authenticated'>
  cancelAuthenticationChallenge: () => void
  logout: () => Promise<void>
  invalidateSession: (options?: { preserveView?: boolean }) => void
  refreshSession: () => Promise<boolean>
  switchTenant: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const BOOTSTRAP_RETRY_DELAY_MS = 700
const BOOTSTRAP_RETRY_ATTEMPTS = 3

function getChallengeFallbackMessage() {
  return 'Informe o código enviado por e-mail para continuar.'
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(() => (loadPendingLogin() ? 'challenge' : 'loading'))
  const [session, setSession] = useState<AuthSession | null>(null)
  const [frozenSession, setFrozenSession] = useState<AuthSession | null>(null)
  const [challengeMessage, setChallengeMessage] = useState(() =>
    loadPendingLogin() ? getChallengeFallbackMessage() : '',
  )

  const applySession = useCallback((nextSession: AuthSession) => {
    applySentrySessionContext(nextSession)
    setSession(nextSession)
    setFrozenSession(nextSession)
    storeActiveTenantId(nextSession.currentTenant.id)
    markAuthenticatedSession()
    clearSessionEndSignal()
    clearSessionLock()
    clearSessionClientPhase()
    clearPendingLogin()
    setChallengeMessage('')
    setStatus('authenticated')
  }, [])

  const clearSessionState = useCallback((options?: { preserveView?: boolean }) => {
    const preserveView = options?.preserveView === true

    applySentrySessionContext(null)
    clearSensitiveClientState({ preserveGlobalSessionSignals: preserveView })
    if (!preserveView) {
      clearAuthenticatedSessionMarker()
    }
    clearSessionClientPhase()
    if (!preserveView) {
      clearSessionLock()
    }
    clearPendingLogin()
    setSession(null)
    if (!preserveView) {
      setFrozenSession(null)
    } else {
      setFrozenSession((current) => current ?? session)
    }
    setChallengeMessage('')
    setStatus('unauthenticated')
  }, [session])

  useEffect(() => {
    let isMounted = true
    let retryTimeoutId: number | null = null

    async function bootstrap(attempt = 0) {
      try {
        const pendingLogin = loadPendingLogin()
        const currentPathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const shouldSkipSessionProbeOnLogin = currentPathname === '/login' && !pendingLogin && !hasAuthenticatedSessionMarker()

        if (shouldSkipSessionProbeOnLogin) {
          applySentrySessionContext(null)
          setFrozenSession(null)
          setSession(null)
          setChallengeMessage('')
          setStatus('unauthenticated')
          return
        }

        if (readSessionLock() && !loadPendingLogin()) {
          applySentrySessionContext(null)
          setFrozenSession(null)
          setSession(null)
          setChallengeMessage('')
          setStatus('unauthenticated')
          return
        }

        const sessionProbe = await authService.probeSession(loadActiveTenantId() || undefined)

        if (!isMounted) {
          return
        }

        if (sessionProbe.kind === 'authenticated') {
          applySession(sessionProbe.session)
          clearSessionLock()
          return
        }

        if (sessionProbe.kind === 'transient_error') {
          if (!loadPendingLogin() && hasAuthenticatedSessionMarker() && attempt < BOOTSTRAP_RETRY_ATTEMPTS) {
            setStatus('loading')
            retryTimeoutId = window.setTimeout(() => {
              void bootstrap(attempt + 1)
            }, BOOTSTRAP_RETRY_DELAY_MS)
            return
          }

          setStatus(loadPendingLogin() ? 'challenge' : 'unauthenticated')
          if (!loadPendingLogin()) {
            applySentrySessionContext(null)
            setFrozenSession(null)
            setSession(null)
          }
          return
        }

        if (loadPendingLogin()) {
          applySentrySessionContext(null)
          setFrozenSession(null)
          setSession(null)
          setStatus('challenge')
          setChallengeMessage(getChallengeFallbackMessage())
          return
        }
        applySentrySessionContext(null)
        setFrozenSession(null)
        setSession(null)
        setStatus('unauthenticated')
      } catch {
        if (!isMounted) {
          return
        }

        applySentrySessionContext(null)
        setFrozenSession(null)
        setSession(null)
        setStatus(loadPendingLogin() ? 'challenge' : 'unauthenticated')
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
      if (retryTimeoutId) {
        window.clearTimeout(retryTimeoutId)
      }
    }
  }, [applySession])

  const value = useMemo<AuthContextValue>(() => {
    const visibleSession = session ?? frozenSession
    return {
      status,
      isAuthenticated: status === 'authenticated' && Boolean(session),
      isLoading: status === 'loading',
      user: visibleSession?.user ?? null,
      session: visibleSession,
      challengeMessage,
      login: async (email: string, senha: string) => {
        const tenantId = loadActiveTenantId()
        const result = await authService.login({ email, senha, tenantId: tenantId || undefined })

        if (result.requiresTwoFactor) {
          storePendingLogin({
            email,
            senha,
            tenantId,
          })
          setSession(null)
          setChallengeMessage(result.message)
          setStatus('challenge')
          return 'challenge'
        }

        applySession(result.session)
        return 'authenticated'
      },
      submitAuthenticationCode: async (codigoAutenticacao: string) => {
        const pendingLogin = loadPendingLogin()

        if (!pendingLogin) {
          throw new Error('A autenticação em duas etapas expirou. Faça login novamente.')
        }

        const result = await authService.login({
          ...pendingLogin,
          codigoAutenticacao,
        })

        if (result.requiresTwoFactor) {
          setChallengeMessage(result.message)
          setStatus('challenge')
          throw new Error(result.message)
        }

        applySession(result.session)
        return 'authenticated'
      },
      cancelAuthenticationChallenge: () => {
        clearPendingLogin()
        setChallengeMessage('')
        setStatus(session ? 'authenticated' : 'unauthenticated')
      },
      logout: async () => {
        try {
          await authService.logout()
        } catch {
          // noop
        }

        clearSessionState()
        window.location.replace('/login')
      },
      invalidateSession: (options) => {
        clearSessionState(options)
      },
      refreshSession: async () => {
        const sessionProbe = await authService.probeSession(loadActiveTenantId() || undefined)

        if (sessionProbe.kind === 'authenticated') {
          applySession(sessionProbe.session)
          return true
        }

        if (sessionProbe.kind === 'transient_error') {
          return status === 'authenticated' && Boolean(session)
        }

        if (sessionProbe.kind === 'unauthenticated') {
          clearSessionState()
          return false
        }

        return false
      },
      switchTenant: async (tenantId: string) => {
        const nextSession = await authService.switchTenant(tenantId)
        applySession(nextSession)
      },
    }
  }, [applySession, challengeMessage, clearSessionState, frozenSession, session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa ser usado dentro de AuthProvider')
  return context
}
