import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, POST } from '@/app/api/condicoes-de-pagamento/[id]/restricoes/route'

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

describe('condicoes pagamento restricoes bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'tenant-1',
      currentUserId: 'user-1',
    })
  })

  it('posts the restriction with the payment term and tenant ids without forcing active true', async () => {
    serverApiFetchMock.mockResolvedValue({ ok: true, status: 200, payload: { data: [{ id: 'rel-1' }] } })

    const response = await POST(new NextRequest('http://localhost/api/condicoes-de-pagamento/10/restricoes', {
      method: 'POST',
      body: JSON.stringify({ ocorrencia: 'cliente', id_objeto: 'cliente-1', ativo: false }),
    }), { params: Promise.resolve({ id: '10' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith('condicoes_pagamento/restricoes', expect.objectContaining({
      token: 'token',
      tenantId: 'tenant-1',
      body: {
        ocorrencia: 'cliente',
        id_objeto: 'cliente-1',
        ativo: false,
        id_condicao_pagamento: '10',
        id_empresa: 'tenant-1',
      },
    }))
  })

  it('blocks editing a synchronized restriction like the legacy controller', async () => {
    serverApiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: { data: [{ id: 'sync-1', id_sync: 'erp-1' }] },
    })

    const response = await POST(new NextRequest('http://localhost/api/condicoes-de-pagamento/10/restricoes', {
      method: 'POST',
      body: JSON.stringify({ id: 'sync-1', ocorrencia: 'cliente', id_objeto: 'cliente-1' }),
    }), { params: Promise.resolve({ id: '10' }) })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Nao e possivel editar uma restricao sincronizada.' })
    expect(serverApiFetchMock).toHaveBeenCalledTimes(1)
  })

  it('blocks deleting synchronized restrictions before calling delete', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, payload: { data: [{ id: 'sync-1', id_sync: 'erp-1' }] } })

    const response = await DELETE(new NextRequest('http://localhost/api/condicoes-de-pagamento/10/restricoes', {
      method: 'DELETE',
      body: JSON.stringify({ ids: ['sync-1'] }),
    }), { params: Promise.resolve({ id: '10' }) })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Nao e possivel excluir restricoes sincronizadas.' })
    expect(serverApiFetchMock).toHaveBeenCalledTimes(1)
  })
})
