import { describe, expect, it, beforeEach, vi } from 'vitest'
import { GET as listModules } from '@/app/api/agile-store/route'
import { GET as getModuleDetail } from '@/app/api/agile-store/[id]/route'
import { POST as runModuleAction } from '@/app/api/agile-store/[id]/action/route'

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

describe('agile-store routes', () => {
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
      payload: { data: [] },
    })
  })

  it('forwards list filters to api v3 app-store modules', async () => {
    const request = new Request('http://localhost/api/agile-store?q=sac&tipo=Atendimento&status=contratados&page=2&perpage=24')

    const response = await listModules(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'app-store/modulos?page=2&perpage=24&q=sac&tipo=Atendimento&status=contratados',
      expect.objectContaining({
        method: 'GET',
        token: 'session-token',
        tenantId: 'empresa-1',
      }),
    )
  })

  it('forwards detail requests with legacy audience context', async () => {
    const request = new Request('http://localhost/api/agile-store/mod_sac')

    const response = await getModuleDetail(request, { params: Promise.resolve({ id: 'mod_sac' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^app-store\/modulos\/mod_sac\?/),
      expect.objectContaining({
        method: 'GET',
        token: 'session-token',
        tenantId: 'empresa-1',
      }),
    )
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('origem=admin_v2_detalhe')
  })

  it('maps public action names to api v3 endpoints and sends tenant context', async () => {
    const request = new Request('http://localhost/api/agile-store/mod_sac/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'contract' }),
    })

    const response = await runModuleAction(request, { params: Promise.resolve({ id: 'mod_sac' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'app-store/modulos/mod_sac/contratar',
      expect.objectContaining({
        method: 'POST',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: expect.objectContaining({
          id_empresa: 'empresa-1',
          user_agent: '',
        }),
      }),
    )
  })

  it('rejects action requests without a session', async () => {
    readAuthSessionMock.mockResolvedValue(null)
    const request = new Request('http://localhost/api/agile-store/mod_sac/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel' }),
    })

    const response = await runModuleAction(request, { params: Promise.resolve({ id: 'mod_sac' }) })

    expect(response.status).toBe(401)
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })
})
