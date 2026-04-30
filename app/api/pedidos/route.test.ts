import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createAuthSessionCookieValue } from '@/src/features/auth/services/auth-session'
import { GET } from '@/app/api/pedidos/route'

const { cookiesMock, headersMock, serverApiFetchMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: headersMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

describe('pedidos bridge', () => {
  beforeEach(() => {
    cookiesMock.mockReset()
    headersMock.mockReset()
    serverApiFetchMock.mockReset()
  })

  it('uses the active tab tenant instead of the shared cookie tenant', async () => {
    const cookieValue = createAuthSessionCookieValue({
      token: 'token',
      currentTenantId: 'ac-araujo',
      currentUserId: '18',
    })
    cookiesMock.mockResolvedValue({
      get: () => ({ value: cookieValue }),
    })
    headersMock.mockResolvedValue(new Headers({
      'X-Admin-V2-Tenant-Id': 'cescom',
    }))
    serverApiFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: {
        data: [],
        meta: {
          page: 1,
          pages: 1,
          perpage: 15,
          total: 0,
        },
      },
    })

    const response = await GET(new NextRequest('http://localhost/api/pedidos?page=1', {
      headers: {
        'X-Admin-V2-Tenant-Id': 'cescom',
      },
    }))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(expect.stringContaining('pedidos/todos?'), expect.objectContaining({
      token: 'token',
      tenantId: 'cescom',
    }))
  })
})
