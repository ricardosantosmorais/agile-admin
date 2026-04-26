import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BASE_CONHECIMENTO_FILTERS, baseConhecimentoClient } from '@/src/features/base-conhecimento/services/base-conhecimento-client'
import { httpClient } from '@/src/services/http/http-client'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

describe('base-conhecimento-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes the default filters expected by the screen', () => {
    expect(DEFAULT_BASE_CONHECIMENTO_FILTERS).toEqual({
      page: 1,
      perPage: 15,
      phrase: '',
    })
  })

  it('trims the search phrase and calls the bridge with no-store cache', async () => {
    vi.mocked(httpClient).mockResolvedValue({ data: [], meta: { page: 1, perPage: 15, total: 0 } })

    await baseConhecimentoClient.list({
      page: 2,
      perPage: 30,
      phrase: '  intercom  ',
    })

    expect(httpClient).toHaveBeenCalledWith('/api/base-conhecimento?page=2&perPage=30&phrase=intercom', {
      method: 'GET',
      cache: 'no-store',
    })
  })
})
