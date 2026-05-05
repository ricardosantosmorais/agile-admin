import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/notificacoes-painel/[id]/empresas/route'

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

describe('notificacoes-painel empresas bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
  })

  it('links the selected notification company without creating push for email-only channel', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'tenant-1',
      currentUserId: 'user-1',
    })
    serverApiFetchMock.mockImplementation(async (path: string) => {
      if (path.startsWith('notificacoes_painel?id=')) {
        return { ok: true, status: 200, payload: { data: [{ id: '10', canal: 'email' }] } }
      }
      return { ok: true, status: 200, payload: { data: [{ id: 'rel-1' }] } }
    })

    const response = await POST(new NextRequest('http://localhost/api/notificacoes-painel/10/empresas', {
      method: 'POST',
      body: JSON.stringify({ id_empresa: 'empresa-selecionada', titulo: 'Aviso' }),
    }), { params: Promise.resolve({ id: '10' }) })

    expect(response.status).toBe(200)
    const calledPaths = serverApiFetchMock.mock.calls.map(([path]) => String(path))
    expect(calledPaths.some((path) => path.startsWith('notificacoes_push'))).toBe(false)
    expect(serverApiFetchMock).toHaveBeenCalledWith('notificacoes_painel/empresas', expect.objectContaining({
      tenantId: 'tenant-1',
      body: { id_notificacao: '10', id_empresa: 'empresa-selecionada' },
    }))
  })
})
