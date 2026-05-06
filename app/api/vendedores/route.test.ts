import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/vendedores/route'

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

describe('vendedores bridge area vendedor', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'empresa-1',
      currentUserId: 'user-1',
    })
  })

  it('bloqueia ativacao da area vendedor quando nao ha cotas disponiveis', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [
            { chave: 'area_representante', parametros: 'v2' },
            { chave: 'quantidade_cotas_vendedor', parametros: '2' },
          ],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { data: [], meta: { total: 2 } },
      })

    const response = await POST(new NextRequest('http://localhost/api/vendedores', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Ana', area_vendedor: true }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Nao ha cotas disponiveis para ativar a area do vendedor.' })
    expect(serverApiFetchMock).toHaveBeenCalledTimes(2)
  })

  it('permite salvar quando o vendedor ja usava area vendedor', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { data: [{ id: '55', area_vendedor: 1 }] },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { id: '55' },
      })

    const response = await POST(new NextRequest('http://localhost/api/vendedores', {
      method: 'POST',
      body: JSON.stringify({ id: '55', nome: 'Ana', area_vendedor: true }),
    }))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'vendedores', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        id: '55',
        area_vendedor: true,
        id_empresa: 'empresa-1',
      }),
    }))
  })
})
