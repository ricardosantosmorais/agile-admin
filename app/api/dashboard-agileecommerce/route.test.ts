import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/dashboard-agileecommerce/route'

const { readAuthSessionMock, serverApiFetchMock } = vi.hoisted(() => ({
  readAuthSessionMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

vi.mock('@/src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-mapper', () => ({
  mapDashboardRootAgileecommercePayload: (payload: unknown) => payload,
}))

describe('dashboard agileecommerce bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
  })

  it('uses the active tab root tenant even when the shared cookie points to another tenant', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: '1698203521854804',
      currentUserId: '18',
    })
    serverApiFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { meta: { tenant_id: 'agileecommerce' } },
    })

    const response = await POST(new NextRequest('http://localhost/api/dashboard-agileecommerce', {
      method: 'POST',
      headers: {
        'X-Admin-V2-Tenant-Id': 'agileecommerce',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: '2025-01-19',
        endDate: '2025-04-17',
        blocks: ['analytics_headline'],
      }),
    }))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith('relatorios/dashboard-agileecommerce', expect.objectContaining({
      token: 'token',
      tenantId: 'agileecommerce',
    }))
  })
})
