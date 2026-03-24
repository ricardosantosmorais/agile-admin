import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCatalogLookupCache, loadCatalogLookupOptions } from '@/src/features/catalog/services/catalog-lookups'
import { httpClient } from '@/src/services/http/http-client'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

describe('catalog-lookups cache', () => {
  beforeEach(() => {
    clearCatalogLookupCache()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('reuses lookup results for five minutes', async () => {
    vi.mocked(httpClient).mockResolvedValue([
      { id: '1', label: 'Filial Matriz' },
    ])

    const first = await loadCatalogLookupOptions('filiais', '', 1, 15)
    const second = await loadCatalogLookupOptions('filiais', '', 1, 15)

    expect(httpClient).toHaveBeenCalledTimes(1)
    expect(first).toEqual([{ id: '1', label: 'Filial Matriz' }])
    expect(second).toEqual([{ id: '1', label: 'Filial Matriz' }])
    expect(first).not.toBe(second)
  })

  it('expires cached results after five minutes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T10:00:00Z'))

    vi.mocked(httpClient)
      .mockResolvedValueOnce([{ id: '1', label: 'Filial Matriz' }])
      .mockResolvedValueOnce([{ id: '2', label: 'Filial Centro' }])

    const first = await loadCatalogLookupOptions('filiais', '', 1, 15)
    vi.setSystemTime(new Date('2026-03-23T10:05:01Z'))
    const second = await loadCatalogLookupOptions('filiais', '', 1, 15)

    expect(httpClient).toHaveBeenCalledTimes(2)
    expect(first).toEqual([{ id: '1', label: 'Filial Matriz' }])
    expect(second).toEqual([{ id: '2', label: 'Filial Centro' }])
  })
})
