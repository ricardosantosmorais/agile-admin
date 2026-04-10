import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { BannerUrlRecord, BannerUniverseRecord } from '@/src/features/banners/types/banners-relations'
import { httpClient } from '@/src/services/http/http-client'

const baseClient = createCrudClient('/api/banners')

export const bannersClient = {
  ...baseClient,
  createUniverse(id: string, payload: Partial<BannerUniverseRecord> & Record<string, unknown>) {
    return httpClient(`/api/banners/${id}/universos`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  deleteUniverses(id: string, ids: string[]) {
    return httpClient(`/api/banners/${id}/universos`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  listAvailableUrls() {
    return httpClient<{ data: BannerUrlRecord[] }>(`/api/empresas/urls?page=1&perPage=1000&orderBy=url&sort=asc`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  saveUrls(id: string, urls: string[]) {
    return httpClient(`/api/banners/${id}/urls`, {
      method: 'POST',
      body: JSON.stringify({ urls }),
      cache: 'no-store',
    })
  },
  resolveLinkPreview(tipoLink: string, objectId: string) {
    const params = new URLSearchParams({
      tipoLink,
      objectId,
    })

    return httpClient<{ link: string | null }>(`/api/banners/link-preview?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
}
