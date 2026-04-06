import { httpClient } from '@/src/services/http/http-client'
import type {
  HttpClientCatalogItem,
  HttpClientCatalogItemDetail,
  HttpClientContext,
  HttpClientRequestDraft,
  HttpClientResponsePayload,
} from '@/src/features/http-client/services/http-client-types'

export const httpClientToolClient = {
  async getContext() {
    return httpClient<HttpClientContext>('/api/http-client/context')
  },

  async sendRequest(request: HttpClientRequestDraft) {
    return httpClient<HttpClientResponsePayload>('/api/http-client/send', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  async listCatalog() {
    return httpClient<{ data: HttpClientCatalogItem[] }>('/api/http-client/catalog')
  },

  async getCatalogItem(id: string) {
    return httpClient<{ data: HttpClientCatalogItemDetail }>(`/api/http-client/catalog/${encodeURIComponent(id)}`)
  },

  async saveCatalogItem(input: {
    id?: string
    nome: string
    descricao: string
    publico: boolean
    request: HttpClientRequestDraft
  }) {
    return httpClient<{ message: string; data: { id: string } }>('/api/http-client/catalog', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
}
