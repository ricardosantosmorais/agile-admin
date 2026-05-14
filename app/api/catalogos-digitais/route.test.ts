import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/catalogos-digitais/route'

const {
  readAuthSessionMock,
  serverApiFetchMock,
} = vi.hoisted(() => ({
  readAuthSessionMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

describe('catalogos-digitais route', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'empresa-1',
    })
    serverApiFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { data: [], meta: { total: 0 } },
    })
  })

  it('forwards list filters to catalogos_digitais and loads app store contract summary', async () => {
    const request = new Request('http://localhost/api/catalogos-digitais?page=2&perpage=30&q=maio&status=pronto')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/^catalogos_digitais\?/), expect.objectContaining({
      method: 'GET',
      token: 'session-token',
      tenantId: 'empresa-1',
    }))
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('page=2')
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('perpage=30')
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('id_empresa=empresa-1')
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('status=pronto')
    expect(new URLSearchParams(serverApiFetchMock.mock.calls[0][0].split('?')[1]).get('q')).toContain("nome like '%maio%'")
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'app-store/modulos?page=1&perpage=60&q=Cat%C3%A1logos+Digitais', expect.objectContaining({
      method: 'GET',
      token: 'session-token',
      tenantId: 'empresa-1',
    }))
  })

  it('rejects requests without session', async () => {
    readAuthSessionMock.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/catalogos-digitais'))

    expect(response.status).toBe(401)
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })
})
