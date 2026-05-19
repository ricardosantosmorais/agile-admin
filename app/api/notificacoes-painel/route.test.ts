import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/notificacoes-painel/route'

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

describe('notificacoes-painel collection bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
  })

  it('rejects unsupported panel notification channels before saving', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'tenant-1',
      currentUserId: 'user-1',
    })

    const response = await POST(new NextRequest('http://localhost/api/notificacoes-painel', {
      method: 'POST',
      body: JSON.stringify({ titulo: 'Aviso', canal: 'novidades' }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.message).toContain('Canal inválido')
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })
  it('rejects base64 or SVG images for notifications that can be sent by e-mail', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'tenant-1',
      currentUserId: 'user-1',
    })

    const response = await POST(new NextRequest('http://localhost/api/notificacoes-painel', {
      method: 'POST',
      body: JSON.stringify({
        titulo: 'Aviso',
        canal: 'todos',
        mensagem: '<p>Oferta</p><img src="data:image/png;base64,abc">',
      }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.message).toContain('imagens embutidas em base64')
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })
})
