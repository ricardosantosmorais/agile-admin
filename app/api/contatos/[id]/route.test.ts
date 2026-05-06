import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/contatos/[id]/route'

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

describe('contatos edit bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'empresa-1',
      currentUserId: 'user-1',
    })
  })

  it('serializa payload de edicao administrativa para a api v3', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { data: [{ id: '77', internalizado: 0 }] },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { id: '77' },
      })

    const response = await POST(new NextRequest('http://localhost/api/contatos/77', {
      method: 'POST',
      body: JSON.stringify({
        status: 'aprovado',
        cnpj_cpf: '12.345.678/0001-99',
        ddd1: '(85)',
        telefone1: '3333-4444',
        whatsapp: '1',
        ativo: false,
      }),
    }), { params: Promise.resolve({ id: '77' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'contatos', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        id: '77',
        id_empresa: 'empresa-1',
        edicao_admin: true,
        status: 'aprovado',
        cnpj_cpf: '12345678000199',
        ddd1: '85',
        telefone1: '33334444',
        whatsapp: true,
        ativo: false,
      }),
    }))
  })

  it('bloqueia edicao quando o contato ja foi internalizado', async () => {
    serverApiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: { data: [{ id: '77', internalizado: true }] },
    })

    const response = await POST(new NextRequest('http://localhost/api/contatos/77', {
      method: 'POST',
      body: JSON.stringify({ status: 'recebido' }),
    }), { params: Promise.resolve({ id: '77' }) })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Nao e permitido editar contatos ja internalizados.' })
    expect(serverApiFetchMock).toHaveBeenCalledTimes(1)
  })
})
