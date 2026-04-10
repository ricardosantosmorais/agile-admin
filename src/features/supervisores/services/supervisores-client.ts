import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { LookupOption } from '@/src/components/ui/lookup-select'

export const supervisoresClient = createCrudClient('/api/supervisores')

export type SupervisorLookupOption = LookupOption

export function loadSupervisorLookup(resource: 'filiais' | 'canais_distribuicao', query: string, page: number, perPage: number) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    perPage: String(perPage),
  })

  return httpClient<SupervisorLookupOption[]>(`/api/lookups/${resource}?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
}
