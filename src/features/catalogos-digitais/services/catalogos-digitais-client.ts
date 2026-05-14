import { httpClient } from '@/src/services/http/http-client'
import { normalizeCatalogoDigitalDetail, normalizeCatalogosDigitaisListResponse, toCatalogoDigitalSavePayload } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'
import type { CatalogoDigitalFormRecord, CatalogosDigitaisRawResponse } from '@/src/features/catalogos-digitais/types/catalogos-digitais'

export type CatalogosDigitaisFilters = {
  page?: number
  perpage?: number
  q?: string
  status?: string
}

function buildQuery(filters: CatalogosDigitaisFilters) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page ?? 1))
  params.set('perpage', String(filters.perpage ?? 15))

  for (const key of ['q', 'status'] as const) {
    const value = String(filters[key] ?? '').trim()
    if (value) params.set(key, value)
  }

  return params.toString()
}

export const catalogosDigitaisClient = {
  async list(filters: CatalogosDigitaisFilters) {
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
