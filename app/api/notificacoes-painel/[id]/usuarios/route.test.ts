import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/notificacoes-painel/[id]/usuarios/route'

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

describe('notificacoes-painel usuarios bridge', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
  })

  it('loads notification audience with channel ordering support', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'tenant-1',
      currentUserId: 'user-1',
    })
    serverApiFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { data: [], meta: { page: 1, pages: 1, perpage: 15, total: 0 } },
    })

    const response = await GET(
      new NextRequest('http://localhost/api/notificacoes-painel/10/usuarios?page=1&perPage=15&orderBy=canais&sort=asc'),
      { params: Promise.resolve({ id: '10' }) },
    )

    expect(response.status).toBe(200)
    const [path, options] = serverApiFetchMock.mock.calls[0]
    expect(path).toContain('notificacoes_painel/audiencia?')
    expect(path).toContain('id_notificacao=10')
    expect(path).toContain('order=canais')
    expect(path).not.toContain('embed=')
    expect(options).toMatchObject({ token: 'token', tenantId: 'tenant-1' })
  })
})
