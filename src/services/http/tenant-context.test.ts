import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildTenantContextHeaders, fetchWithTenantContext } from '@/src/services/http/tenant-context'

describe('tenant context transport helpers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  it('adds the active tab tenant to local app api requests', () => {
    window.sessionStorage.setItem('admin-v2-web:tenant', 'cescom')

    expect(buildTenantContextHeaders('/api/pedidos')).toMatchObject({
      'X-Admin-V2-Tenant-Id': 'cescom',
    })
  })

  it('preserves existing tenant headers case-insensitively', () => {
    window.sessionStorage.setItem('admin-v2-web:tenant', 'cescom')

    expect(buildTenantContextHeaders('/api/pedidos', {
      'x-admin-v2-tenant-id': 'ac-araujo',
    })).toMatchObject({
      'x-admin-v2-tenant-id': 'ac-araujo',
    })
  })

  it('does not force json content type on multipart style requests', async () => {
    window.sessionStorage.setItem('admin-v2-web:tenant', 'cescom')
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }))

    const formData = new FormData()
    formData.append('file', new Blob(['x']), 'arquivo.txt')

    await fetchWithTenantContext('/api/uploads', {
      method: 'POST',
      body: formData,
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/uploads', expect.objectContaining({
      headers: expect.not.objectContaining({
        'Content-Type': expect.any(String),
      }),
    }))
    expect(fetchMock).toHaveBeenCalledWith('/api/uploads', expect.objectContaining({
      headers: expect.objectContaining({
        'X-Admin-V2-Tenant-Id': 'cescom',
      }),
    }))
  })
})
