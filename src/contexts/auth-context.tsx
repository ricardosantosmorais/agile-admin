'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { authService } from '@/src/features/auth/services/auth-service'
import {
  clearAuthenticatedSessionMarker,
  clearPendingLogin,
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
import type { AuthSession, AuthUser } from '@/src/features/auth/types/auth'

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
  invalidateSession: () => void
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
  const [challengeMessage, setChallengeMessage] = useState(() =>
    loadPendingLogin() ? getChallengeFallbackMessage() : '',
  )

  useEffect(() => {
    let isMounted = true
    let retryTimeoutId: number | null = null

    async function bootstrap(attempt = 0) {
      try {
        if (readSessionLock() && !loadPendingLogin()) {
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
          setSession(sessionProbe.session)
          storeActiveTenantId(sessionProbe.session.currentTenant.id)
          clearSessionLock()
          clearPendingLogin()
          setChallengeMessage('')
          setStatus('authenticated')
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
          return
        }

        if (loadPendingLogin()) {
          setStatus('challenge')
          setChallengeMessage(getChallengeFallbackMessage())
          return
        }
        setStatus('unauthenticated')
      } catch {
        if (!isMounted) {
          return
        }

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
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    function applySession(nextSession: AuthSession) {
      setSession(nextSession)
      storeActiveTenantId(nextSession.currentTenant.id)
      markAuthenticatedSession()
      clearPendingLogin()
      setChallengeMessage('')
      setStatus('authenticated')
    }

    return {
      status,
      isAuthenticated: status === 'authenticated' && Boolean(session),
      isLoading: status === 'loading',
      user: session?.user ?? null,
      session,
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

        clearSensitiveClientState()
        clearAuthenticatedSessionMarker()
        clearSessionLock()
        clearPendingLogin()
        setSession(null)
        setChallengeMessage('')
        setStatus('unauthenticated')
        window.location.replace('/login')
      },
      invalidateSession: () => {
        clearSensitiveClientState()
        clearAuthenticatedSessionMarker()
        clearSessionLock()
        clearPendingLogin()
        setSession(null)
        setChallengeMessage('')
        setStatus('unauthenticated')
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
          return false
        }

        return false
      },
      switchTenant: async (tenantId: string) => {
        const nextSession = await authService.switchTenant(tenantId)
        applySession(nextSession)
      },
    }
  }, [challengeMessage, session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa ser usado dentro de AuthProvider')
  return context
}
