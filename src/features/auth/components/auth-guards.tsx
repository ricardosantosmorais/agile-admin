'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { AlertTriangle, LogIn } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { getSessionEndCopy, useSessionLifecycle } from '@/src/contexts/session-lifecycle-context'
import { clearAuthenticatedSessionMarker } from '@/src/features/auth/services/auth-tab-storage'
import { useI18n } from '@/src/i18n/use-i18n'

type GuardProps = {
  children: ReactNode
}

function SessionEndedOverlay({
  title,
  text,
  onGoToLogin,
  loginLabel,
}: {
  title: string
  text: string
  onGoToLogin: () => void
  loginLabel: string
}) {
  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center bg-[rgba(15,23,42,0.14)] p-4 backdrop-blur-[3px]">
      <div className="app-pane w-full max-w-xl rounded-[1.6rem] border border-line p-6 shadow-[0_32px_90px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-start gap-4">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="text-sm leading-6 text-slate-600">{text}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onGoToLogin}
            className="app-button-primary inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition"
          >
            <LogIn className="mr-2 h-4 w-4" />
            {loginLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading, logout, session } = useAuth()
  const { endedReason, shouldBlockUnauthenticatedRedirect } = useSessionLifecycle()
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && shouldBlockUnauthenticatedRedirect && !session) {
      clearAuthenticatedSessionMarker()
      router.replace(`/login?from=${encodeURIComponent(pathname || '/dashboard')}`)
      return
    }

    if (!isLoading && !isAuthenticated && !shouldBlockUnauthenticatedRedirect) {
      router.replace(`/login?from=${encodeURIComponent(pathname || '/dashboard')}`)
    }
  }, [isAuthenticated, isLoading, pathname, router, session, shouldBlockUnauthenticatedRedirect])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated && shouldBlockUnauthenticatedRedirect && !session) {
    return null
  }

  if (!isAuthenticated && !shouldBlockUnauthenticatedRedirect) {
    return null
  }

  if (shouldBlockUnauthenticatedRedirect) {
    const endedCopy = getSessionEndCopy(t, endedReason ?? 'unknown')

    return (
      <>
        {children}
        <SessionEndedOverlay
          title={endedCopy.title}
          text={endedCopy.text}
          loginLabel={t('session.ended.goToLogin', 'Ir para login')}
          onGoToLogin={() => {
            clearAuthenticatedSessionMarker()
            void logout()
          }}
        />
      </>
    )
  }

  return <>{children}</>
}

export function PublicRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) {
    return null
  }

  return children
}
