import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getDashboard } from '@/app/api/sac/dashboard/route'
import { GET as listTickets } from '@/app/api/sac/chamados/route'
import { GET as getTicketDetail } from '@/app/api/sac/chamados/[id]/route'
import { POST as runTicketAction } from '@/app/api/sac/chamados/[id]/action/route'
import { GET as listAreas } from '@/app/api/sac/areas/route'
import { GET as listSubjects } from '@/app/api/sac/assuntos/route'
import { GET as listUsers } from '@/app/api/sac/usuarios/route'

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

describe('sac admin routes', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'empresa-1',
    })
    serverApiFetchMock.mockResolvedValue({ ok: true, status: 200, payload: { data: {} } })
  })

  it('forwards dashboard period filters to api v3 SAC dashboard', async () => {
    const response = await getDashboard(new Request('http://localhost/api/sac/dashboard?data_inicial=2026-05-01&data_final=2026-05-07&id_usuario_responsavel=15'))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/dashboard?data_inicial=2026-05-01&data_final=2026-05-07&id_usuario_responsavel=15',
      expect.objectContaining({ method: 'GET', token: 'session-token', tenantId: 'empresa-1' }),
    )
  })

  it('forwards legacy ticket list filters and default ordering', async () => {
    const response = await listTickets(new Request('http://localhost/api/sac/chamados?status=pendentes_atuacao&cliente=alfa&protocolo=SAC&page=3&perpage=20'))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados?page=3&perpage=20&order=ultima_interacao_em&sort=desc&status=pendentes_atuacao&cliente=alfa&protocolo=SAC',
      expect.objectContaining({ method: 'GET', token: 'session-token', tenantId: 'empresa-1' }),
    )
  })

  it('loads a ticket detail by id through the tenant bridge', async () => {
    const response = await getTicketDetail(new Request('http://localhost/api/sac/chamados/42'), { params: Promise.resolve({ id: '42' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados/42',
      expect.objectContaining({ method: 'GET', token: 'session-token', tenantId: 'empresa-1' }),
    )
  })

  it('maps v2 action names to api v3 SAC ticket endpoints', async () => {
    const response = await runTicketAction(new Request('http://localhost/api/sac/chamados/42/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'respond', mensagem: 'Resposta ao cliente', status: 'aguardando_cliente', updated_at: '2026-05-07 10:00:00' }),
    }), { params: Promise.resolve({ id: '42' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados/42/responder',
      expect.objectContaining({
        method: 'POST',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: { mensagem: 'Resposta ao cliente', status: 'aguardando_cliente', updated_at: '2026-05-07 10:00:00' },
      }),
    )
  })

  it('forwards SAC lookup requests without adding fixed menu assumptions', async () => {
    await listAreas()
    await listSubjects(new Request('http://localhost/api/sac/assuntos?id_sac_area=area-1'))
    await listUsers()

    expect(serverApiFetchMock).toHaveBeenNthCalledWith(1, 'sac/admin/areas', expect.objectContaining({ method: 'GET' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'sac/admin/assuntos?id_sac_area=area-1', expect.objectContaining({ method: 'GET' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(3, 'sac/admin/usuarios', expect.objectContaining({ method: 'GET' }))
  })

  it('rejects SAC requests without a session', async () => {
    readAuthSessionMock.mockResolvedValue(null)

    const response = await listTickets(new Request('http://localhost/api/sac/chamados'))

    expect(response.status).toBe(401)
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })
})
