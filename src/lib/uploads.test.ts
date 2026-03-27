import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMultipartUploadHandler, getDisplayFileName, normalizeUploadResult } from '@/src/lib/uploads'

describe('uploads helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes string upload response', () => {
    expect(normalizeUploadResult('https://cdn.example.com/banner.png')).toEqual({
      value: 'https://cdn.example.com/banner.png',
      previewValue: 'https://cdn.example.com/banner.png',
    })
  })

  it('extracts file name from url', () => {
    expect(getDisplayFileName('https://cdn.example.com/banners/meu-banner.png?x=1')).toBe('meu-banner.png')
  })

  it('creates a multipart upload handler that maps json responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ file_url: 'https://cdn.example.com/banner.png', s3_key: 'banners/banner.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const handler = createMultipartUploadHandler({
      endpoint: '/api/uploads/banner',
      query: { profile: 'tenant-public-images' },
    })

    const file = new File(['content'], 'banner.png', { type: 'image/png' })
    const result = await handler(file)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      value: 'https://cdn.example.com/banner.png',
      previewValue: 'https://cdn.example.com/banner.png',
      fileName: 'banner.png',
      storageKey: 'banners/banner.png',
    })
  })
})
