import { cleanup, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '@/src/features/auth/components/auth-guards'
import { renderWithProviders } from '@/src/test/render'

const replaceMock = vi.fn()
const useAuthMock = vi.fn()
const useSessionLifecycleMock = vi.fn()

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoading: false,
  session: {
    user: {
      id: '1',
    },
  } as { user: { id: string } } | null,
  logout: vi.fn(),
}))

const sessionLifecycleState = vi.hoisted(() => ({
  shouldBlockUnauthenticatedRedirect: false,
  endedReason: null as
    | 'idle_timeout'
    | 'expired_no_action'
    | 'csrf_invalid'
    | 'tenant_context_invalid'
    | 'session_expired_or_recycled'
    | 'unauthenticated'
    | 'http_401'
    | 'unknown'
    | null,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    replace: replaceMock,
  }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/src/contexts/session-lifecycle-context', async () => {
  const actual = await vi.importActual<typeof import('@/src/contexts/session-lifecycle-context')>('@/src/contexts/session-lifecycle-context')
  return {
    ...actual,
    useSessionLifecycle: () => useSessionLifecycleMock(),
  }
})

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    replaceMock.mockReset()
    authState.logout.mockReset()
    authState.isAuthenticated = true
    authState.isLoading = false
    authState.session = {
      user: {
        id: '1',
      },
    }
    sessionLifecycleState.shouldBlockUnauthenticatedRedirect = false
    sessionLifecycleState.endedReason = null
    useAuthMock.mockReturnValue(authState)
    useSessionLifecycleMock.mockReturnValue(sessionLifecycleState)
  })

  it('renders protected children while authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })

  it('shows the ended-session blocker while keeping the current screen visible underneath', () => {
    authState.isAuthenticated = false
    sessionLifecycleState.shouldBlockUnauthenticatedRedirect = true
    sessionLifecycleState.endedReason = 'idle_timeout'
    useAuthMock.mockReturnValue({
      ...authState,
      isAuthenticated: false,
    })
    useSessionLifecycleMock.mockReturnValue({
      ...sessionLifecycleState,
      shouldBlockUnauthenticatedRedirect: true,
      endedReason: 'idle_timeout',
    })

    renderWithProviders(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
    expect(screen.getByText('Sessão encerrada por inatividade')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ir para login/i })).toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('redirects to login after reload when the session is already ended and there is no frozen view left', () => {
    authState.isAuthenticated = false
    authState.session = null
    sessionLifecycleState.shouldBlockUnauthenticatedRedirect = true
    sessionLifecycleState.endedReason = 'expired_no_action'
    useAuthMock.mockReturnValue({
      ...authState,
      isAuthenticated: false,
      session: null,
    })
    useSessionLifecycleMock.mockReturnValue({
      ...sessionLifecycleState,
      shouldBlockUnauthenticatedRedirect: true,
      endedReason: 'expired_no_action',
    })

    renderWithProviders(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>,
    )

    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ir para login/i })).not.toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/login?from=%2Fdashboard')
  })
})
