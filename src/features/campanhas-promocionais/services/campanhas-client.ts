import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

export type CampanhaProdutoRecord = {
  id_campanha: string
  id_produto: string
  posicao?: number | string | null
  principal?: boolean | number | string
  aplica_tributos?: boolean | number | string
  tipo?: string | null
  valor?: number | string | null
  produto?: {
    id?: string
    codigo?: string | null
    nome?: string | null
    disponivel?: boolean | number | string
  } | null
}

type CampaignWithRelations = {
  produtos?: CampanhaProdutoRecord[] | null
}

const baseClient = createCrudClient('/api/campanhas')

export const campanhasClient = {
  ...baseClient,
  async listProdutos(id: string) {
    const response = await baseClient.getById(id, 'produtos') as CampaignWithRelations
    return Array.isArray(response.produtos) ? response.produtos : []
  },
  createProdutos(payload: Record<string, unknown> | Array<Record<string, unknown>>) {
    return httpClient('/api/campanhas/produtos', {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  resolveProdutos(tokens: string[]) {
    return httpClient<{ resolved: Array<{ token: string; id: string; label: string }>; missing: string[] }>('/api/lookups/produtos-resolver', {
      method: 'POST',
      body: JSON.stringify({ tokens }),
      cache: 'no-store',
    })
  },
  deleteProdutos(payload: Array<Record<string, unknown>>) {
    return httpClient('/api/campanhas/produtos', {
      method: 'DELETE',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
}
