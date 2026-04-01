import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/src/contexts/auth-context'
import { renderWithProviders } from '@/src/test/render'

const { probeSessionMock } = vi.hoisted(() => ({
  probeSessionMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-service', () => ({
  authService: {
    probeSession: probeSessionMock,
    getSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    switchTenant: vi.fn(),
  },
}))

function buildSession() {
  return {
    user: {
      id: '1',
      nome: 'Teste',
      email: 'teste@example.com',
      funcionalidades: [],
      master: false,
      cargo: 'Analista',
    },
    tenants: [
      {
        id: '10',
        nome: 'Tenant 10',
        codigo: 'T10',
        status: 'ativo',
      },
    ],
    currentTenant: {
      id: '10',
      nome: 'Tenant 10',
      codigo: 'T10',
      status: 'ativo',
    },
    sessionIdleTimeoutSeconds: 7200,
    sessionWarningTimeoutSeconds: 120,
  }
}

function AuthStateProbe() {
  const { status, isAuthenticated } = useAuth()
  return <div>{`${status}:${isAuthenticated ? 'yes' : 'no'}`}</div>
}

function RefreshSessionProbe() {
  const { status, isAuthenticated, refreshSession } = useAuth()
  return (
    <div>
      <div>{`${status}:${isAuthenticated ? 'yes' : 'no'}`}</div>
      <button type="button" onClick={() => void refreshSession()}>
        refresh
      </button>
    </div>
  )
}

function FrozenSessionProbe() {
  const { status, isAuthenticated, session, invalidateSession } = useAuth()
  return (
    <div>
      <div>{`${status}:${isAuthenticated ? 'yes' : 'no'}`}</div>
      <div>{session?.currentTenant.nome ?? 'sem-sessao'}</div>
      <button type="button" onClick={() => invalidateSession({ preserveView: true })}>
        freeze
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    probeSessionMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('retries bootstrap after a transient session fetch error when a previous authenticated marker exists', async () => {
    window.localStorage.setItem('admin-v2-web:auth-seen', '1')
    probeSessionMock
      .mockResolvedValueOnce({ kind: 'transient_error', error: new Error('Transient dev reload error') })
      .mockResolvedValueOnce({
        kind: 'authenticated',
        session: buildSession(),
      })

    renderWithProviders(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading:no')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('authenticated:yes')).toBeInTheDocument()
    }, { timeout: 2000 })
  }, 4000)

  it('keeps the authenticated state when refreshSession hits a transient error', async () => {
    probeSessionMock
      .mockResolvedValueOnce({
        kind: 'authenticated',
        session: buildSession(),
      })
      .mockResolvedValueOnce({ kind: 'transient_error', error: new Error('Dev server recompiling') })

    renderWithProviders(
      <AuthProvider>
        <RefreshSessionProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('authenticated:yes')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }))

    await waitFor(() => {
      expect(screen.getByText('authenticated:yes')).toBeInTheDocument()
    })
  })

  it('preserves the current session view when invalidating with preserveView', async () => {
    probeSessionMock.mockResolvedValueOnce({
      kind: 'authenticated',
      session: buildSession(),
    })

    renderWithProviders(
      <AuthProvider>
        <FrozenSessionProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('authenticated:yes')).toBeInTheDocument()
      expect(screen.getByText('Tenant 10')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'freeze' }))

    await waitFor(() => {
      expect(screen.getByText('unauthenticated:no')).toBeInTheDocument()
      expect(screen.getByText('Tenant 10')).toBeInTheDocument()
    })
  })

  it('clears the ended-session markers when a new authenticated session is applied', async () => {
    window.localStorage.setItem('admin-v2-web:session-end-global', JSON.stringify({
      reason: 'expired_no_action',
      tabId: 'tab-1',
      ts: Date.now(),
    }))

    probeSessionMock.mockResolvedValueOnce({
      kind: 'authenticated',
      session: buildSession(),
    })

    renderWithProviders(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('authenticated:yes')).toBeInTheDocument()
    })

    expect(window.localStorage.getItem('admin-v2-web:session-end-global')).toBeNull()
  })
})
