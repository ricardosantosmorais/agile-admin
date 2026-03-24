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
        session: {
          user: { id: '1', nome: 'Teste' },
          currentTenant: { id: '10', nome: 'Tenant 10' },
          sessionIdleTimeoutSeconds: 7200,
          sessionWarningTimeoutSeconds: 120,
        },
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
        session: {
          user: { id: '1', nome: 'Teste' },
          currentTenant: { id: '10', nome: 'Tenant 10' },
          sessionIdleTimeoutSeconds: 7200,
          sessionWarningTimeoutSeconds: 120,
        },
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
})
