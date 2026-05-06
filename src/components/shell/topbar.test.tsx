import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Topbar } from '@/src/components/shell/topbar'
import { renderWithProviders } from '@/src/test/render'

const useAuthMock = vi.fn()
const useTenantMock = vi.fn()
const useUiMock = vi.fn()
const useSessionLifecycleMock = vi.fn()
const useRouterMock = vi.fn()
const getMenuItemsMock = vi.fn()
const flattenMenuItemsMock = vi.fn()
const getNotificationsMock = vi.fn()
const markNotificationsAsReadMock = vi.fn()
const getChangelogMock = vi.fn()
const getTenantDebugInfoMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/src/contexts/tenant-context', () => ({
  useTenant: () => useTenantMock(),
}))

vi.mock('@/src/contexts/ui-context', () => ({
  useUi: () => useUiMock(),
}))

vi.mock('@/src/contexts/session-lifecycle-context', () => ({
  useSessionLifecycle: () => useSessionLifecycleMock(),
}))

vi.mock('@/src/components/navigation/menu-items', () => ({
  getMenuItems: (...args: unknown[]) => getMenuItemsMock(...args),
  flattenMenuItems: (...args: unknown[]) => flattenMenuItemsMock(...args),
}))

vi.mock('@/src/services/app-data', () => ({
  appData: {
    shell: {
      getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
      markNotificationsAsRead: (...args: unknown[]) => markNotificationsAsReadMock(...args),
      getChangelog: (...args: unknown[]) => getChangelogMock(...args),
      getTenantDebugInfo: (...args: unknown[]) => getTenantDebugInfoMock(...args),
    },
  },
}))

describe('Topbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useRouterMock.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
    })

    useAuthMock.mockReturnValue({
      logout: vi.fn().mockResolvedValue(undefined),
      session: {
        currentTenant: { id: '1698203521854804' },
      },
      user: {
        id: '1',
        nome: 'Ricardo Morais',
        cargo: 'Administrador',
        email: 'ricardo@teste.com',
        avatarFallback: 'RM',
        master: true,
      },
    })

    useTenantMock.mockReturnValue({
      currentTenant: {
        id: '1698203521854804',
        nome: 'Cescom Distribuidor',
        codigo: 'producao',
        status: 'Operando',
        clusterHost: 'host.local',
        clusterApi: 'api.local',
      },
      tenants: [
        {
          id: '1698203521854804',
          nome: 'Cescom Distribuidor',
          codigo: 'producao',
          status: 'Operando',
        },
      ],
      isSwitchingTenant: false,
      switchTenant: vi.fn().mockResolvedValue(undefined),
    })

    useUiMock.mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
      toggleSidebar: vi.fn(),
    })

    useSessionLifecycleMock.mockReturnValue({
      shouldBlockUnauthenticatedRedirect: false,
    })

    getMenuItemsMock.mockReturnValue([])
    flattenMenuItemsMock.mockReturnValue([])
    getNotificationsMock.mockResolvedValue({
      items: [],
      pendingReadReceipts: [],
    })
    markNotificationsAsReadMock.mockResolvedValue(undefined)
    getChangelogMock.mockResolvedValue([])
    getTenantDebugInfoMock.mockResolvedValue({
      platformToken: 'tenant-token-123',
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the tenant id for master users in the selector', () => {
    renderWithProviders(<Topbar />)

    expect(screen.getByRole('button', { name: /cescom distribuidor - 1698203521854804/i })).toBeInTheDocument()
  })

  it('requests notifications when the panel is opened', async () => {
    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      pendingReadReceipts: [],
    })

    renderWithProviders(<Topbar />)

    fireEvent.click(screen.getAllByLabelText(/notificações|notifications/i)[0])

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith('1698203521854804')
    })
  })

  it('loads the platform token for master users when the user menu is opened', async () => {
    renderWithProviders(<Topbar />)

    fireEvent.click(screen.getByText('Ricardo Morais').closest('button')!)

    await waitFor(() => {
      expect(getTenantDebugInfoMock).toHaveBeenCalledWith('1698203521854804')
    })

    expect(await screen.findByText('tenant-token-123')).toBeInTheDocument()
  })
})
