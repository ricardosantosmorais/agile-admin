import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidateRemoteCacheService } from '@/src/services/http/cache-invalidation'

const { readAuthSessionMock, serverApiFetchMock, captureOperationalServerErrorMock } = vi.hoisted(() => ({
  readAuthSessionMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
  captureOperationalServerErrorMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

vi.mock('@/src/lib/sentry', () => ({
  captureOperationalServerError: captureOperationalServerErrorMock,
}))

describe('cache-invalidation', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    captureOperationalServerErrorMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'token',
      currentTenantId: 'empresa-1',
    })
    serverApiFetchMock.mockResolvedValue({ ok: true, status: 200, payload: { success: true } })
  })

  it('invalida o cache completo quando nenhum servico segmentado e informado', async () => {
    await invalidateRemoteCacheService('')

    expect(serverApiFetchMock).toHaveBeenCalledWith('cache/clear', {
      method: 'GET',
      token: 'token',
      tenantId: 'empresa-1',
    })
  })

  it('mantem invalidacao segmentada quando o servico e informado', async () => {
    await invalidateRemoteCacheService('Componentes')

    expect(serverApiFetchMock).toHaveBeenCalledWith('cache/clear/Componentes', {
      method: 'GET',
      token: 'token',
      tenantId: 'empresa-1',
    })
  })
})
