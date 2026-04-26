import { beforeEach, describe, expect, it, vi } from 'vitest'
import { integracaoComErpApiClient } from '@/src/features/integracao-com-erp-api/services/integracao-com-erp-api-client'
import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyIntegracaoComErpParametersPayload, normalizeIntegracaoComErpConfigRecord } from '@/src/lib/integracao-com-erp-parameter-form'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

vi.mock('@/src/lib/integracao-com-erp-parameter-form', () => ({
  buildDirtyIntegracaoComErpParametersPayload: vi.fn(),
  normalizeIntegracaoComErpConfigRecord: vi.fn(),
}))

describe('integracao-com-erp-api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes the GET payload through the shared parameter form helper', async () => {
    vi.mocked(httpClient).mockResolvedValue({ raw: true })
    vi.mocked(normalizeIntegracaoComErpConfigRecord).mockReturnValue({ host: 'api.local' } as never)

    const response = await integracaoComErpApiClient.get()

    expect(httpClient).toHaveBeenCalledWith('/api/integracao-com-erp/api', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(normalizeIntegracaoComErpConfigRecord).toHaveBeenCalledWith({ raw: true })
    expect(response).toEqual({ host: 'api.local' })
  })

  it('skips POST when no dirty parameters exist and posts only changed parameters otherwise', async () => {
    vi.mocked(buildDirtyIntegracaoComErpParametersPayload)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([{ nome: 'host', valor: 'api.local' }] as never)
    vi.mocked(httpClient).mockResolvedValue({ success: true })

    await expect(integracaoComErpApiClient.save([], {}, {})).resolves.toEqual({
      success: true,
      skipped: true,
    })

    await integracaoComErpApiClient.save([] as never, {} as never, {} as never)

    expect(httpClient).toHaveBeenCalledWith('/api/integracao-com-erp/api', {
      method: 'POST',
      body: JSON.stringify({
        parameters: [{ nome: 'host', valor: 'api.local' }],
      }),
      cache: 'no-store',
    })
  })
})
