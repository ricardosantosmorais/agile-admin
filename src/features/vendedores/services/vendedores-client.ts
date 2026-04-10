import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { LookupOption } from '@/src/components/ui/lookup-select'
import { httpClient } from '@/src/services/http/http-client'
import type { VendedorLinkedUser } from '@/src/features/vendedores/types/vendedores'

export const vendedoresClient = createCrudClient('/api/vendedores')

export type VendedorLookupResource = 'filiais' | 'canais_distribuicao' | 'supervisores'
export type VendedorLookupOption = LookupOption

export function loadVendedorLookup(resource: VendedorLookupResource, query: string, page: number, perPage: number) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    perPage: String(perPage),
  })

  return httpClient<VendedorLookupOption[]>(`/api/lookups/${resource}?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export function addVendedorCanais(vendedorId: string, payload: { id_canal_distribuicao: string; limite_credito: number | null }) {
  return httpClient(`/api/vendedores/${vendedorId}/canais`, {
    method: 'POST',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}

export function deleteVendedorCanais(vendedorId: string, channelIds: string[]) {
  return httpClient(`/api/vendedores/${vendedorId}/canais`, {
    method: 'DELETE',
    body: JSON.stringify({ channelIds }),
    cache: 'no-store',
  })
}

export function getVendedorLinkedUsers(vendedorId: string) {
  return httpClient<VendedorLinkedUser[]>(`/api/vendedores/${vendedorId}/linked-users`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export function unlinkVendedorLinkedUser(vendedorId: string, userId: string) {
  return httpClient(`/api/vendedores/${vendedorId}/linked-users`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
    cache: 'no-store',
  })
}
