import { beforeEach, describe, expect, it, vi } from 'vitest'
import { integracaoComErpInstalacaoIntegradorClient } from '@/src/features/integracao-com-erp-instalacao-integrador/services/integracao-com-erp-instalacao-integrador-client'
import { httpClient } from '@/src/services/http/http-client'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

describe('integracao-com-erp-instalacao-integrador-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the installer metadata from the dedicated bridge', async () => {
    vi.mocked(httpClient).mockResolvedValue({
      token: 'token-1',
      downloadUrl: 'https://download.exemplo.com/integrador.exe',
    })

    const response = await integracaoComErpInstalacaoIntegradorClient.get()

    expect(httpClient).toHaveBeenCalledWith('/api/integracao-com-erp/instalacao-do-integrador', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(response).toEqual({
      token: 'token-1',
      downloadUrl: 'https://download.exemplo.com/integrador.exe',
    })
  })
})
