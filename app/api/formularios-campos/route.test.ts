import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, POST } from '@/app/api/formularios-campos/route'

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

describe('formularios-campos bridge cache invalidation', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'empresa-1',
      currentUserId: 'user-1',
    })
  })

  it('invalida o cache segmentado de campos depois de salvar ou reordenar com sucesso', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, payload: [{ id: '100' }] })
      .mockResolvedValueOnce({ ok: true, status: 200, payload: { success: true } })

    const response = await POST(new NextRequest('http://localhost/api/formularios-campos', {
      method: 'POST',
      body: JSON.stringify([{ id: '100', posicao: 1 }]),
    }))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'cache/clear/FormularioCampo', expect.objectContaining({
      method: 'GET',
      token: 'token',
      tenantId: 'empresa-1',
    }))
  })

  it('invalida o cache segmentado de campos depois de excluir com sucesso', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, payload: { success: true } })
      .mockResolvedValueOnce({ ok: true, status: 200, payload: { success: true } })

    const response = await DELETE(new NextRequest('http://localhost/api/formularios-campos', {
      method: 'DELETE',
      body: JSON.stringify({ ids: ['100'] }),
    }))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'cache/clear/FormularioCampo', expect.objectContaining({
      method: 'GET',
      token: 'token',
      tenantId: 'empresa-1',
    }))
  })
})
