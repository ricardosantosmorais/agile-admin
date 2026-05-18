import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, POST } from '@/app/api/catalogos-digitais/route'
import { GET as GET_DETAIL } from '@/app/api/catalogos-digitais/[id]/route'

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

  it('forwards legacy code/name filters and applies validity overlap locally', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [
            {
              id: 'CAT-1',
              codigo: 'CAT-1',
              nome: 'Campanha Maio',
              metadata: JSON.stringify({ vigencia_inicio: '2026-05-01', vigencia_fim: '2026-05-31' }),
            },
            {
              id: 'CAT-2',
              codigo: 'CAT-2',
              nome: 'Campanha Junho',
              metadata: JSON.stringify({ vigencia_inicio: '2026-06-01', vigencia_fim: '2026-06-30' }),
            },
          ],
          meta: { total: 2 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { data: [] },
      })

    const request = new Request('http://localhost/api/catalogos-digitais?page=1&perpage=15&code=CAT&name=Campanha&status=pronto&validFrom=2026-05-10&validTo=2026-05-20')

    const response = await GET(request)
    const payload = await response.json()
    const query = new URLSearchParams(serverApiFetchMock.mock.calls[0][0].split('?')[1])

    expect(response.status).toBe(200)
    expect(query.get('page')).toBe('1')
    expect(query.get('perpage')).toBe('5000')
    expect(query.get('status')).toBe('pronto')
    expect(query.get('q')).toContain("codigo like '%CAT%'")
    expect(query.get('q')).toContain("descricao like '%Campanha%'")
    expect(payload.data).toHaveLength(1)
    expect(payload.data[0].id).toBe('CAT-1')
    expect(payload.meta).toEqual(expect.objectContaining({ page: 1, perpage: 15, total: 1, pages: 1 }))
  })

  it('rejects requests without session', async () => {
    readAuthSessionMock.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/catalogos-digitais'))

    expect(response.status).toBe(401)
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })

  it('loads a catalog detail by active tenant and embeds products', async () => {
    const response = await GET_DETAIL(new Request('http://localhost/api/catalogos-digitais/CAT-1'), { params: Promise.resolve({ id: 'CAT-1' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais?id_empresa=empresa-1&id=CAT-1&embed=produtos&perpage=1',
      expect.objectContaining({
        method: 'GET',
        token: 'session-token',
        tenantId: 'empresa-1',
      }),
    )
  })

  it('saves a catalog payload with tenant context', async () => {
    const request = new Request('http://localhost/api/catalogos-digitais', {
      method: 'POST',
      body: JSON.stringify({
        id: 'CAT-1',
        nome: 'Campanha Junho',
        metadata: '{}',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais',
      expect.objectContaining({
        method: 'POST',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: expect.objectContaining({
          id: 'CAT-1',
          id_empresa: 'empresa-1',
          nome: 'Campanha Junho',
        }),
      }),
    )
  })

  it('deletes catalogs with tenant context', async () => {
    const request = new Request('http://localhost/api/catalogos-digitais', {
      method: 'DELETE',
      body: JSON.stringify({ ids: ['CAT-1', 'CAT-2'] }),
    })

    const response = await DELETE(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais',
      expect.objectContaining({
        method: 'DELETE',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: [
          { id: 'CAT-1', id_empresa: 'empresa-1' },
          { id: 'CAT-2', id_empresa: 'empresa-1' },
        ],
      }),
    )
  })
})
