import { beforeEach, describe, expect, it, vi } from 'vitest'
import { integracaoComErpImagensClient } from '@/src/features/integracao-com-erp-imagens/services/integracao-com-erp-imagens-client'
import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyIntegracaoComErpParametersPayload, normalizeIntegracaoComErpConfigRecord } from '@/src/lib/integracao-com-erp-parameter-form'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

vi.mock('@/src/lib/integracao-com-erp-parameter-form', () => ({
  buildDirtyIntegracaoComErpParametersPayload: vi.fn(),
  normalizeIntegracaoComErpConfigRecord: vi.fn(),
}))

describe('integracao-com-erp-imagens-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes the GET payload through the shared helper', async () => {
    vi.mocked(httpClient).mockResolvedValue({ raw: true })
    vi.mocked(normalizeIntegracaoComErpConfigRecord).mockReturnValue({ bucket: 'tenant-imgs' } as never)

    const response = await integracaoComErpImagensClient.get()

    expect(httpClient).toHaveBeenCalledWith('/api/integracao-com-erp/imagens', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(normalizeIntegracaoComErpConfigRecord).toHaveBeenCalledWith({ raw: true })
    expect(response).toEqual({ bucket: 'tenant-imgs' })
  })

  it('skips POST without dirty parameters and serializes changed parameters otherwise', async () => {
    vi.mocked(buildDirtyIntegracaoComErpParametersPayload)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([{ nome: 'bucket', valor: 'tenant-imgs' }] as never)
    vi.mocked(httpClient).mockResolvedValue({ success: true })

    await expect(integracaoComErpImagensClient.save([], {}, {})).resolves.toEqual({
      success: true,
      skipped: true,
    })

    await integracaoComErpImagensClient.save([] as never, {} as never, {} as never)

    expect(httpClient).toHaveBeenCalledWith('/api/integracao-com-erp/imagens', {
      method: 'POST',
      body: JSON.stringify({
        parameters: [{ nome: 'bucket', valor: 'tenant-imgs' }],
      }),
      cache: 'no-store',
    })
  })
})
