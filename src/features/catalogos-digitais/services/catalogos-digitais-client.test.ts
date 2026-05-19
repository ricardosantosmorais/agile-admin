import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogosDigitaisClient } from '@/src/features/catalogos-digitais/services/catalogos-digitais-client'

const { fetchWithTenantContextMock } = vi.hoisted(() => ({
  fetchWithTenantContextMock: vi.fn(),
}))

const { httpClientMock } = vi.hoisted(() => ({
  httpClientMock: vi.fn(),
}))

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: httpClientMock,
}))

vi.mock('@/src/services/http/tenant-context', () => ({
  fetchWithTenantContext: fetchWithTenantContextMock,
}))

describe('catalogosDigitaisClient', () => {
  beforeEach(() => {
    fetchWithTenantContextMock.mockReset()
    httpClientMock.mockReset()
  })

  it('uploads section images to the tenant catalog folder using the shared upload bridge', async () => {
    fetchWithTenantContextMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        file_url: 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg',
        s3_key: 'catalogos-digitais/tenant-123/banner.jpg',
        file_name: 'banner.jpg',
      }),
    })

    const file = new File(['image'], 'banner.jpg', { type: 'image/jpeg' })
    const result = await catalogosDigitaisClient.uploadSectionImage(file, {
      catalogId: 'CAT-1',
      tenantBucketUrl: 'https://tenant-assets.agilecdn.com.br',
      tenantId: 'tenant-123',
    })

    expect(fetchWithTenantContextMock).toHaveBeenCalledWith('/api/uploads', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
    const body = fetchWithTenantContextMock.mock.calls[0][1].body as FormData
    expect(body.get('file')).toBe(file)
    expect(body.get('profileId')).toBe('tenant-public-images')
    expect(body.get('folder')).toBe('catalogos-digitais/tenant-123')
    expect(body.get('tenantBucketUrl')).toBe('https://tenant-assets.agilecdn.com.br')
    expect(body.get('id_catalogo')).toBe('CAT-1')
    expect(body.get('fixedFileName')).toBeNull()
    expect(result).toEqual({
      value: 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg',
      previewValue: 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg',
      fileName: 'banner.jpg',
      storageKey: 'catalogos-digitais/tenant-123/banner.jpg',
    })
  })

  it('requests pricing options and snapshot recalculation through the studio bridge', async () => {
    httpClientMock
      .mockResolvedValueOnce({ data: { filiais: [{ id: 'FIL-1', nome: 'Filial' }] } })
      .mockResolvedValueOnce({ payload: { produtos: [{ id: 'PROD-1', preco_valor: '99.9' }] }, meta: { precificados: 1 } })

    const options = await catalogosDigitaisClient.pricingOptions()
    const result = await catalogosDigitaisClient.recalculateSnapshot({
      nome: 'Catalogo',
      produtos: [{ id: 'PROD-1' }],
      secoes: [{ tipo: 'produtos_grid', produtos: ['PROD-1'], mostrar_preco: true }],
      precificacao: { id_filial: 'FIL-1' },
    })

    expect(options.data.filiais).toEqual([{ id: 'FIL-1', nome: 'Filial' }])
    expect(result.meta).toEqual({ precificados: 1 })
    expect(httpClientMock).toHaveBeenNthCalledWith(1, '/api/catalogos-digitais/studio', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'pricingOptions' }),
    }))
    expect(httpClientMock).toHaveBeenNthCalledWith(2, '/api/catalogos-digitais/studio', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        action: 'priceSnapshot',
        payload: {
          nome: 'Catalogo',
          produtos: [{ id: 'PROD-1' }],
          secoes: [{ tipo: 'produtos_grid', produtos: ['PROD-1'], mostrar_preco: true }],
          precificacao: { id_filial: 'FIL-1' },
        },
      }),
    }))
  })
})
