import { httpClient } from '@/src/services/http/http-client'
import { normalizeCatalogoDigitalDetail, normalizeCatalogosDigitaisListResponse, toCatalogoDigitalSavePayload } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'
import type {
  CatalogoDigitalFormRecord,
  CatalogoDigitalPricingOptions,
  CatalogoDigitalPricingSnapshotResult,
  CatalogoDigitalProductsResult,
  CatalogosDigitaisListFilters,
  CatalogosDigitaisRawResponse,
} from '@/src/features/catalogos-digitais/types/catalogos-digitais'
import type { UploadAssetResult } from '@/src/lib/uploads'
import { fetchWithTenantContext } from '@/src/services/http/tenant-context'

type UploadSectionImageOptions = {
  catalogId?: string
  tenantBucketUrl?: string
  tenantId?: string
}

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
  async delete(ids: string[]) {
    await httpClient('/api/catalogos-digitais', {
      method: 'DELETE',
      cache: 'no-store',
      body: JSON.stringify({ ids }),
    })
  },
  async searchProducts(payload: { q?: string; codigos?: string; perpage?: number }) {
    return httpClient<CatalogoDigitalProductsResult>('/api/catalogos-digitais/studio', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({
        action: payload.codigos ? 'resolveProducts' : 'searchProducts',
        q: payload.q,
        codigos: payload.codigos,
        perpage: payload.perpage ?? 18,
      }),
    })
  },
  async importCollection(collectionId: string) {
    return httpClient<CatalogoDigitalProductsResult>('/api/catalogos-digitais/studio', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({
        action: 'importCollection',
        id_colecao: collectionId,
      }),
    })
  },
  async pricingOptions() {
    return httpClient<CatalogoDigitalPricingOptions>('/api/catalogos-digitais/studio', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({
        action: 'pricingOptions',
      }),
    })
  },
  async recalculateSnapshot(payload: Record<string, unknown>) {
    return httpClient<CatalogoDigitalPricingSnapshotResult>('/api/catalogos-digitais/studio', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({
        action: 'priceSnapshot',
        payload,
      }),
    })
  },
  async previewDraft(payload: Record<string, unknown>) {
    const response = await fetchWithTenantContext('/api/catalogos-digitais/studio', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'previewDraft',
        payload,
      }),
    })

    const text = await response.text()
    if (!response.ok) {
      throw new Error(text || 'Não foi possível gerar a prévia do rascunho.')
    }

    return text
  },
  async uploadSectionImage(file: File, options: UploadSectionImageOptions): Promise<UploadAssetResult> {
    const folder = ['catalogos-digitais', options.tenantId].map((item) => String(item || '').trim()).filter(Boolean).join('/')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('profileId', 'tenant-public-images')
    formData.append('folder', folder || 'catalogos-digitais')
    if (options.tenantBucketUrl?.trim()) {
      formData.append('tenantBucketUrl', options.tenantBucketUrl.trim())
    }
    if (options.catalogId?.trim()) {
      formData.append('id_catalogo', options.catalogId.trim())
    }

    const response = await fetchWithTenantContext('/api/uploads', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(typeof payload?.message === 'string' ? payload.message : 'Não foi possível enviar a imagem.')
    }

    const value = typeof payload?.file_url === 'string'
      ? payload.file_url
      : typeof payload?.value === 'string'
        ? payload.value
        : ''

    if (!value) {
      throw new Error('Resposta de upload inválida.')
    }

    return {
      value,
      previewValue: typeof payload?.previewValue === 'string' ? payload.previewValue : value,
      fileName: typeof payload?.file_name === 'string' ? payload.file_name : file.name,
      storageKey: typeof payload?.s3_key === 'string' ? payload.s3_key : undefined,
    }
  },
}
