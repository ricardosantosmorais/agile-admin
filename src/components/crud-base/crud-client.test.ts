import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCrudLookupCache, createCrudClient, loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

describe('crud-client lookup cache', () => {
  beforeEach(() => {
    clearCrudLookupCache()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('reuses lookup search results for five minutes', async () => {
    vi.mocked(httpClient).mockResolvedValue([
      { value: '12', label: 'Home principal' },
    ])

    const first = await loadCrudLookupOptions('areas_banner', '', 1, 15)
    const second = await loadCrudLookupOptions('areas_banner', '', 1, 15)

    expect(httpClient).toHaveBeenCalledTimes(1)
    expect(first).toEqual([{ value: '12', label: 'Home principal' }])
    expect(second).toEqual([{ value: '12', label: 'Home principal' }])
    expect(first).not.toBe(second)
  })

  it('expires cached lookup search results after five minutes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T10:00:00Z'))

    vi.mocked(httpClient)
      .mockResolvedValueOnce([{ value: '12', label: 'Home principal' }])
      .mockResolvedValueOnce([{ value: '13', label: 'Home secundária' }])

    const first = await loadCrudLookupOptions('areas_banner', '', 1, 15)
    vi.setSystemTime(new Date('2026-03-23T10:05:01Z'))
    const second = await loadCrudLookupOptions('areas_banner', '', 1, 15)

    expect(httpClient).toHaveBeenCalledTimes(2)
    expect(first).toEqual([{ value: '12', label: 'Home principal' }])
    expect(second).toEqual([{ value: '13', label: 'Home secundária' }])
  })

  it('caches full option lists loaded by the shared crud client', async () => {
    const client = createCrudClient('/api/areas-banner')
    vi.mocked(httpClient).mockResolvedValue([
      { id: '12', nome: 'Home principal' },
    ])

    const first = await client.listOptions('areas_banner')
    const second = await client.listOptions('areas_banner')

    expect(httpClient).toHaveBeenCalledTimes(1)
    expect(first).toEqual([{ value: '12', label: 'Home principal - 12' }])
    expect(second).toEqual([{ value: '12', label: 'Home principal - 12' }])
    expect(first).not.toBe(second)
  })
})
