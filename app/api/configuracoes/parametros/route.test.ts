import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/configuracoes/parametros/route'

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

describe('configuracoes parametros bridge', () => {
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

  it('encaminha filtro de filial por id_filial para empresas parametros', async () => {
    const request = new NextRequest('http://localhost/api/configuracoes/parametros?page=2&perpage=30&id_filial=42&chave=header')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^empresas\/parametros\?/),
      expect.objectContaining({
        method: 'GET',
        token: 'session-token',
        tenantId: 'empresa-1',
      }),
    )

    const forwardedPath = String(serverApiFetchMock.mock.calls[0][0])
    const forwardedParams = new URLSearchParams(forwardedPath.split('?')[1])

    expect(forwardedParams.get('id_filial')).toBe('42')
    expect(forwardedParams.get('filial:nome_fantasia::like')).toBeNull()
    expect(forwardedParams.get('chave::like')).toBe('header')
  })
})
