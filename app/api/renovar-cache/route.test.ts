import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/renovar-cache/route'

const {
  captureOperationalServerErrorMock,
  enrichMasterPayloadMock,
  mapAuthSessionMock,
  readAuthSessionMock,
  serverApiFetchMock,
} = vi.hoisted(() => ({
  captureOperationalServerErrorMock: vi.fn(),
  enrichMasterPayloadMock: vi.fn(),
  mapAuthSessionMock: vi.fn(),
  readAuthSessionMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/features/auth/services/auth-server', () => ({
  enrichMasterPayload: enrichMasterPayloadMock,
}))

vi.mock('@/src/features/auth/services/auth-mappers', () => ({
  extractApiErrorMessage: (_payload: unknown, fallback: string) => fallback,
  mapAuthSession: mapAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

vi.mock('@/src/lib/sentry', () => ({
  captureOperationalServerError: captureOperationalServerErrorMock,
}))

describe('renovar-cache route', () => {
  beforeEach(() => {
    captureOperationalServerErrorMock.mockReset()
    enrichMasterPayloadMock.mockReset()
    mapAuthSessionMock.mockReset()
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()

    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'empresa-1',
    })
    enrichMasterPayloadMock.mockResolvedValue({ ok: true })
    mapAuthSessionMock.mockReturnValue({
      currentTenant: {
        id: 'empresa-1',
        clusterApi: 'https://cluster.example/api',
      },
    })
    serverApiFetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, payload: { token: 'valid' } })
      .mockResolvedValueOnce({ ok: true, status: 200, payload: { data: [{ parametros: 'platform-token' }] } })
  })

  it('registra erro operacional quando a limpeza direta no cluster falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: 'falha no cluster' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      },
    )))

    const response = await POST()

    expect(response.status).toBe(500)
    expect(captureOperationalServerErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      area: 'remote-cache',
      action: 'renew-cache',
      path: 'cache/clear',
      status: 500,
      tenantId: 'empresa-1',
      payload: { message: 'falha no cluster' },
      requestMeta: expect.objectContaining({
        target: 'cluster-api',
        clusterConfigured: true,
      }),
    }))
  })

  it('prioriza o token da sessão ao limpar o cache direto no cluster', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: 'Cache renovado com sucesso.' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    ))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith('https://cluster.example/api/cache/clear', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer session-token',
      }),
    }))
  })
})
