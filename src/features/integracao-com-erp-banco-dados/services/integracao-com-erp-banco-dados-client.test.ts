import { beforeEach, describe, expect, it, vi } from 'vitest'
import { integracaoComErpBancoDadosClient } from '@/src/features/integracao-com-erp-banco-dados/services/integracao-com-erp-banco-dados-client'
import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyIntegracaoComErpParametersPayload, normalizeIntegracaoComErpConfigRecord } from '@/src/lib/integracao-com-erp-parameter-form'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

vi.mock('@/src/lib/integracao-com-erp-parameter-form', () => ({
  buildDirtyIntegracaoComErpParametersPayload: vi.fn(),
  normalizeIntegracaoComErpConfigRecord: vi.fn(),
}))

describe('integracao-com-erp-banco-dados-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes fixed fields through the shared normalization helper', async () => {
    const fixedFields = [{ key: 'host' }] as never
    vi.mocked(httpClient).mockResolvedValue({ raw: true })
    vi.mocked(normalizeIntegracaoComErpConfigRecord).mockReturnValue({ host: 'db.local' } as never)

    const response = await integracaoComErpBancoDadosClient.get(fixedFields)

    expect(normalizeIntegracaoComErpConfigRecord).toHaveBeenCalledWith({ raw: true }, fixedFields)
    expect(response).toEqual({ host: 'db.local' })
  })

  it('skips POST without dirty parameters and serializes changed parameters otherwise', async () => {
    vi.mocked(buildDirtyIntegracaoComErpParametersPayload)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([{ nome: 'database', valor: 'erp' }] as never)
    vi.mocked(httpClient).mockResolvedValue({ success: true })

    await expect(integracaoComErpBancoDadosClient.save([], {}, {})).resolves.toEqual({
      success: true,
      skipped: true,
    })

    await integracaoComErpBancoDadosClient.save([] as never, {} as never, {} as never)

    expect(httpClient).toHaveBeenCalledWith('/api/integracao-com-erp/banco-de-dados', {
      method: 'POST',
      body: JSON.stringify({
        parameters: [{ nome: 'database', valor: 'erp' }],
      }),
      cache: 'no-store',
    })
  })
})
