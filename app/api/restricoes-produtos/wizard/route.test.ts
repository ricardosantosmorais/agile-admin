import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/restricoes-produtos/wizard/route'

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

describe('restricoes-produtos wizard route', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()

    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'empresa-1',
    })
    serverApiFetchMock.mockResolvedValue({ ok: true, status: 200, payload: { success: true } })
  })

  it('normalizes active weekday HH:MM values to API time format and clears inactive times', async () => {
    const request = new NextRequest('http://localhost/api/restricoes-produtos/wizard', {
      method: 'POST',
      body: JSON.stringify({
        id: 'parent-1',
        rows: [{
          motivo: 'Bloqueio por horario',
          seg: 1,
          seg_horario_de: '08:30',
          seg_horario_ate: '18:00',
          ter: 0,
          ter_horario_de: '09:00',
          ter_horario_ate: '10:00',
        }],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenLastCalledWith(
      'restricoes_produtos',
      expect.objectContaining({
        method: 'POST',
        body: [expect.objectContaining({
          id: 'parent-1',
          id_pai: null,
          id_empresa: 'empresa-1',
          seg: 1,
          seg_horario_de: '08:30:00',
          seg_horario_ate: '18:00:00',
          ter: 0,
          ter_horario_de: null,
          ter_horario_ate: null,
        })],
      }),
    )
  })
})
