import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/notificacoes-painel/[id]/publicar/route'

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

describe('notificacoes-painel publicar bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
  })

  it('publishes email-channel notifications through the email endpoint without push delivery', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'tenant-1',
      currentUserId: 'user-1',
    })
    serverApiFetchMock.mockImplementation(async (path: string) => {
      if (path.startsWith('notificacoes_painel?id=')) {
        return {
          ok: true,
          status: 200,
          payload: {
            data: [{
              id: '10',
              titulo: 'Aviso',
              canal: 'email',
              data_inicio: '2026-05-01 00:00:00',
              data_fim: '2026-05-31 23:59:59',
              ativo: 1,
              publicado: 0,
              registrar_changelog: 0,
            }],
          },
        }
      }
      if (path.startsWith('notificacoes_painel/empresas?')) {
        return {
          ok: true,
          status: 200,
          payload: { data: [{ id: '1', id_empresa: 'empresa-1' }] },
        }
      }
      return { ok: true, status: 200, payload: { data: [] } }
    })

    const response = await POST(new Request('http://localhost/api/notificacoes-painel/10/publicar', { method: 'POST' }), {
      params: Promise.resolve({ id: '10' }),
    })

    expect(response.status).toBe(200)
    const calledPaths = serverApiFetchMock.mock.calls.map(([path]) => String(path))
    expect(calledPaths.some((path) => path.startsWith('notificacoes_push'))).toBe(false)
    expect(calledPaths).toContain('notificacoes_painel')
    expect(calledPaths).toContain('notificacoes_painel/email')
    expect(serverApiFetchMock).toHaveBeenCalledWith('notificacoes_painel/email', expect.objectContaining({
      body: { id_notificacao: '10', id_empresas: ['empresa-1'] },
    }))
  })
})
