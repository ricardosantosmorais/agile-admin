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
}: {
  title: string
  text: string
  onGoToLogin: () => void
}) {
  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center bg-[rgba(15,23,42,0.14)] p-4 backdrop-blur-[3px]">
      <div className="w-full max-w-xl rounded-[1.6rem] border border-[#e6dfd3] bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.22)]">
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
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#0f172a] px-5 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Ir para login
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const { endedReason, shouldBlockUnauthenticatedRedirect } = useSessionLifecycle()
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !shouldBlockUnauthenticatedRedirect) {
      router.replace(`/login?from=${encodeURIComponent(pathname || '/dashboard')}`)
    }
  }, [isAuthenticated, isLoading, pathname, router, shouldBlockUnauthenticatedRedirect])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated && !shouldBlockUnauthenticatedRedirect) {
    return null
  }

  if (shouldBlockUnauthenticatedRedirect) {
    const endedCopy = getSessionEndCopy(t, endedReason ?? 'unknown')

    return (
      <SessionEndedOverlay
        title={endedCopy.title}
        text={endedCopy.text}
        onGoToLogin={() => {
          clearAuthenticatedSessionMarker()
          void logout()
        }}
      />
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
