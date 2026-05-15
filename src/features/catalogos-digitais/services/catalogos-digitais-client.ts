import { httpClient } from '@/src/services/http/http-client'
import { normalizeCatalogoDigitalDetail, normalizeCatalogosDigitaisListResponse, toCatalogoDigitalSavePayload } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'
import type { CatalogoDigitalFormRecord, CatalogosDigitaisListFilters, CatalogosDigitaisRawResponse } from '@/src/features/catalogos-digitais/types/catalogos-digitais'

function buildQuery(filters: CatalogosDigitaisListFilters) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page ?? 1))
  params.set('perpage', String(filters.perpage ?? 15))

  for (const key of ['q', 'code', 'name', 'status', 'validFrom', 'validTo'] as const) {
    const value = String(filters[key] ?? '').trim()
    if (value) params.set(key, value)
  }

  return params.toString()
}

export const catalogosDigitaisClient = {
  async list(filters: CatalogosDigitaisListFilters) {
    const response = await httpClient<CatalogosDigitaisRawResponse>(`/api/catalogos-digitais?${buildQuery(filters)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeCatalogosDigitaisListResponse(response)
  },
  async detail(id: string) {
    const response = await httpClient<unknown>(`/api/catalogos-digitais/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeCatalogoDigitalDetail(response)
  },
  async save(form: CatalogoDigitalFormRecord) {
    return httpClient('/api/catalogos-digitais', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(toCatalogoDigitalSavePayload(form)),
    })
  },
}
